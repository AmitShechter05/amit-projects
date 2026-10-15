import 'server-only';
import { wcReady, wcGet, wcGetCached } from './wc';
import { applyPrices, applyStock, type PriceMap, type StockMap } from './catalog';

/**
 * המחירים מווקומרס.
 *
 * ------------------------------------------------------------------
 * ווקומרס הוא המקום שבו עמית משנה מחיר, ולכן הוא המקור. האתר קורא
 * משם את המחיר שבתוקף לכל מק״ט ומחיל אותו על הקטלוג (`applyPrices`),
 * לפני שמשהו מרונדר.
 *
 * מה נלקח: השדה `price` - המחיר שלקוח משלם עכשיו, כלומר מחיר המבצע אם
 * הוגדר כזה. מה שלא נלקח: `regular_price` כמחיר מחוק. מחיר "לפני" מוצג
 * רק אם הדגם באמת נמכר בו, וזו החלטה שנכתבת בקטלוג (`compareAt`) ולא
 * נגזרת משדה בפאנל.
 *
 * רק מוצרים שפורסמו. מוצר בטיוטה או בפח אינו במפה, ונשאר על המחיר
 * האחרון שהיה לו.
 * ------------------------------------------------------------------
 */

/** כמה זמן מחיר נחשב טרי, בשניות. שינוי בווקומרס מגיע לאתר בתוך הזמן הזה */
export const PRICES_TTL = 300;
export const PRICES_TAG = 'wc-prices';

type Row = {
  sku: string;
  price: string;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  meta_data?: { key: string; value: unknown }[];
};

// המלאי מגיע באותה קריאה: הוא משתנה באותו קצב, ונשמר באותו מטמון
const PARAMS = { per_page: 100, status: 'publish', _fields: 'sku,price,manage_stock,stock_quantity,meta_data' };

function toMap(rows: Row[]): PriceMap {
  const map: PriceMap = {};
  for (const r of rows) {
    const v = Number(r.price);
    // מחיר ריק, אפס או שלילי אינו מחיר: עדיף המחיר הקודם על פני ₪0 באתר
    if (r.sku && Number.isFinite(v) && v > 0) map[r.sku] = v;
  }
  return map;
}

/**
 * המלאי לפי ברכה. מוצר שהמלאי שלו לא מנוהל בווקומרס לא נכנס למפה (אין
 * הגבלה). מנוהל עם `_mikra_stock` - הפירוט לברכות; מנוהל בלי פירוט -
 * הכמות הכוללת תחת `*`.
 */
function toStock(rows: Row[]): StockMap {
  const map: StockMap = {};
  for (const r of rows) {
    if (!r.sku || !r.manage_stock) continue;
    const raw = r.meta_data?.find((m) => m.key === '_mikra_stock')?.value;
    let by: Record<string, number> | null = null;
    try {
      const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (v && typeof v === 'object') {
        by = {};
        for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
          const q = Math.floor(Number(n));
          if (Number.isFinite(q)) by[k] = Math.max(0, q);
        }
      }
    } catch {
      by = null;
    }
    map[r.sku] = by ?? { '*': Math.max(0, Number(r.stock_quantity) || 0) };
  }
  return map;
}

/**
 * קורא את המחירים ומחיל אותם על הקטלוג. מחזיר את המפה, כדי שהפריסה
 * תעביר אותה גם לצד הלקוח.
 *
 * כל עמוד שמרנדר מחיר בשרת קורא לזה בראשו, ולא רק הפריסה: Next מרנדר
 * פריסה ועמוד במקביל, ועמוד שלא חיכה בעצמו עלול לקרוא מחיר ישן.
 *
 * `fresh` עוקף את המטמון. זה לצ'קאאוט בלבד: הסכום שנגבה חייב להיות
 * המחיר של הרגע הזה, כי ווקומרס מחשב את ההזמנה לפיו.
 *
 * כישלון אינו מפיל עמוד. הקטלוג נשאר על המחירים האחרונים שהוחלו, או
 * על אלה שבקוד אם זו הריצה הראשונה, והשגיאה נרשמת.
 */
export async function syncPrices(opts: { fresh?: boolean } = {}): Promise<PriceMap> {
  if (!wcReady) return {};
  try {
    const rows = opts.fresh
      ? await wcGet<Row[]>('/products', PARAMS)
      : await wcGetCached<Row[]>('/products', PARAMS, PRICES_TTL, [PRICES_TAG]);
    const map = toMap(rows);
    applyPrices(map);
    applyStock(toStock(rows));
    return map;
  } catch (e) {
    console.error('price sync failed - keeping the prices already in the catalogue', e);
    return {};
  }
}
