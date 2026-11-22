import 'server-only';
import { getProduct, getProductBySku, blessingStock, FINISHES } from './catalog';
import { getBlessing, isBlessingId } from './blessings';
import { distinctName } from './seo';
import { jpegImage } from './jpegImage';
import { SITE_URL } from './site';
import type { OrderLine } from './wcOrderCore';

/**
 * אירועים ל-Klaviyo, מהשרת.
 *
 * ------------------------------------------------------------------
 * למה (עמית, 22.11.2026): המיילים השיווקיים עוברים ל-Klaviyo. התוסף
 * הרשמי של Klaviyo לווקומרס רואה רק את עמוד הקופה של ווקומרס - והקופה
 * של מקרא בנויה באתר. בלי האירוע הזה Klaviyo לא יודעת שמישהו פתח
 * הזמנה ולא שילם, ואין מייל עגלה נטושה.
 *
 * האירוע נשלח ברגע שנוצרת הזמנה שממתינה לתשלום - אותו רגע שבו התוסף
 * שלנו (mikra-store) מתחיל את זרימת הנטישה שלו. "Placed Order" מגיע
 * מהתוסף של Klaviyo כשההזמנה משולמת, והוא שמוציא את הלקוח מהזרימה.
 * ------------------------------------------------------------------
 *
 * מהשרת ולא מהדפדפן: klaviyo.js נחסם בחוסמי פרסומות ובספארי, כמו
 * הפיקסל של מטא. אין מפתח (KLAVIYO_PRIVATE_KEY) - לא נשלח כלום.
 */
const KEY = process.env.KLAVIYO_PRIVATE_KEY;
const REVISION = '2025-10-15';

/** 0501234567 -> +972501234567. Klaviyo דוחה את כל האירוע על מספר לא תקין, אז רק נייד ישראלי */
function e164(phone: string | undefined) {
  const d = (phone ?? '').replace(/\D/g, '');
  return /^05\d{8}$/.test(d) ? `+972${d.slice(1)}` : undefined;
}

type Profile = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  marketing?: boolean;
  /** שדות נוספים על הפרופיל (מקור, יום הולדת) */
  extra?: Record<string, unknown>;
};

async function send(metric: string, profile: Profile, properties: Record<string, unknown>, value: number, uniqueId: string) {
  if (!KEY || !profile.email) return 'off';
  const body = {
    data: {
      type: 'event',
      attributes: {
        properties,
        value,
        value_currency: 'ILS',
        unique_id: uniqueId,
        time: new Date().toISOString(),
        metric: { data: { type: 'metric', attributes: { name: metric } } },
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email: profile.email.trim().toLowerCase(),
              ...(profile.firstName ? { first_name: profile.firstName } : {}),
              ...(profile.lastName ? { last_name: profile.lastName } : {}),
              ...(e164(profile.phone) ? { phone_number: e164(profile.phone) } : {}),
              // ההסכמה האחרונה שנתן בקופה. הזרימה מתפצלת לפיה: מי שלא הסכים
              // מקבל תזכורת שירות בלי קוד הנחה (חוק הספאם)
              ...(profile.marketing === undefined && !profile.extra
                ? {}
                : {
                    properties: {
                      ...(profile.marketing === undefined ? {} : { 'Mikra Marketing Consent': Boolean(profile.marketing) }),
                      ...(profile.extra ?? {}),
                    },
                  }),
            },
          },
        },
      },
    },
  };
  const res = await fetch('https://a.klaviyo.com/api/events', {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${KEY}`,
      revision: REVISION,
      'Content-Type': 'application/vnd.api+json',
      accept: 'application/vnd.api+json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`klaviyo ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return 'sent';
}

/** הפריטים כמו שהמייל צריך אותם: שם עם צבע, ברכה, תמונה על לבן, קישור */
function items(lines: OrderLine[]) {
  return lines.flatMap((l) => {
    const p = getProduct(l.slug);
    if (!p) return [];
    return [
      {
        ProductID: p.sku,
        SKU: p.sku,
        ProductName: distinctName(p),
        Color: FINISHES[p.finish],
        Blessing: getBlessing(l.blessing).plain,
        Quantity: l.qty,
        ItemPrice: p.price,
        RowTotal: p.price * l.qty,
        ImageURL: `${SITE_URL}${jpegImage(p)}`,
        ProductURL: `${SITE_URL}/products/${p.slug}`,
      },
    ];
  });
}

export async function klaviyoStartedCheckout(input: {
  orderId: number;
  orderNumber: string;
  orderKey?: string;
  total: number;
  lines: OrderLine[];
  gift: boolean;
  code: string | null;
  customer: { firstName: string; lastName: string; email: string; phone: string; marketing: boolean };
}) {
  const list = items(input.lines);
  const checkoutUrl = input.orderKey
    ? `${SITE_URL}/checkout/pay?o=${input.orderId}&k=${encodeURIComponent(input.orderKey)}`
    : `${SITE_URL}/checkout`;
  return send(
    'Started Checkout',
    { ...input.customer },
    {
      $event_id: `checkout-${input.orderId}`,
      $value: input.total,
      OrderId: input.orderId,
      OrderNumber: input.orderNumber,
      CheckoutURL: checkoutUrl,
      // מייל ההנחה מוסיף &c=<קוד אישי>; הקוד נכנס להזמנה ב-/checkout/apply
      ApplyURL: input.orderKey
        ? `${SITE_URL}/checkout/apply?o=${input.orderId}&k=${encodeURIComponent(input.orderKey)}`
        : checkoutUrl,
      ItemNames: list.map((i) => i.ProductName),
      Items: list,
      ImageURL: list[0]?.ImageURL,
      Blessing: list[0]?.Blessing,
      GiftWrap: input.gift,
      Coupon: input.code ?? undefined,
      MarketingConsent: input.customer.marketing,
      Source: 'mikra.shop',
    },
    input.total,
    `checkout-${input.orderId}`,
  );
}

/* ------------------------------------------------------------------
 * אחרי התשלום ואחרי המשלוח - מהוובהוק של ווקומרס (/api/wc/order-event).
 *
 * למה לא מהתוסף של Klaviyo: הסנכרון שלו לא עבר (22.11 - 0% אחרי שעה,
 * ואף הזמנה לא נרשמה), ואין בו את מה שהמיילים צריכים: מפתח ההזמנה
 * לקישור הביקורת, הברכה, והתמונה על לבן. כאן הכל מגיע מההזמנה עצמה.
 *
 * "Mikra Paid Order" גם מוציא מזרימת הנטישה (סינון הזרימה: לא קרה
 * מאז שנכנס). "Mikra Order Shipped" מתחיל את מיילי אחרי המשלוח.
 * ------------------------------------------------------------------ */
type WcOrderForKlaviyo = {
  id: number;
  number: string;
  order_key?: string;
  total: string;
  billing?: { first_name?: string; last_name?: string; email?: string; phone?: string };
  line_items?: { sku?: string; name: string; quantity: number; total: string; meta_data?: { key: string; value: unknown }[] }[];
  meta_data?: { key: string; value: unknown }[];
};

function orderProps(o: WcOrderForKlaviyo) {
  const lines = o.line_items ?? [];
  const items = lines.map((li) => {
    const p = li.sku ? getProductBySku(li.sku) : undefined;
    const bid = String(li.meta_data?.find((m) => m.key === '_mikra_blessing_id')?.value ?? '');
    const blessing = isBlessingId(bid) ? getBlessing(bid).plain : String(li.meta_data?.find((m) => m.key === 'הברכה')?.value ?? '');
    return {
      SKU: li.sku ?? '',
      ProductName: p ? distinctName(p) : li.name,
      Color: p ? FINISHES[p.finish] : undefined,
      BlessingID: isBlessingId(bid) ? bid : undefined,
      Blessing: blessing || undefined,
      Quantity: li.quantity,
      RowTotal: Number(li.total),
      ImageURL: p ? `${SITE_URL}${jpegImage(p)}` : undefined,
      ProductURL: p ? `${SITE_URL}/products/${p.slug}` : undefined,
    };
  });
  const first = items.find((i) => i.BlessingID);
  const key = o.order_key ? encodeURIComponent(o.order_key) : '';
  return {
    OrderId: o.id,
    OrderNumber: o.number,
    ItemNames: items.map((i) => i.ProductName),
    Items: items,
    ImageURL: items[0]?.ImageURL,
    Blessing: first?.Blessing,
    BlessingURL: first?.BlessingID ? `${SITE_URL}/blessings/${first.BlessingID}` : `${SITE_URL}/blessings`,
    // הכוכבים במייל מוסיפים &s=1..5; העמוד בודק שההזמנה שולמה
    ReviewURL: key ? `${SITE_URL}/review?o=${o.id}&k=${key}` : `${SITE_URL}/review`,
    // כרטיס מתנה לא נשלח בדואר - אין "לפני שעונדים" ואין ביקורת עליו
    GiftCardOnly: items.length > 0 && items.every((i) => /^GIFT/i.test(i.SKU)),
    Source: 'mikra.shop',
  };
}

export async function klaviyoOrderEvent(kind: 'paid' | 'shipped', o: WcOrderForKlaviyo) {
  const b = o.billing ?? {};
  if (!b.email) return 'no-email';
  const props = orderProps(o);
  const name = kind === 'paid' ? 'Mikra Paid Order' : 'Mikra Order Shipped';
  return send(
    name,
    { email: b.email, firstName: b.first_name, lastName: b.last_name, phone: b.phone, marketing: undefined },
    { $event_id: `${kind}-${o.id}`, $value: Number(o.total), ...props },
    Number(o.total),
    `${kind}-${o.id}`,
  );
}

/* ------------------------------------------------------------------
 * הרשמה, עגלה ויום הולדת (22.11.2026) - לזרימות "ברוכים הבאים" ו"עגלה
 * נטושה לפני הקופה" ב-Klaviyo, במקום התוסף (marketing.php, cart.php).
 * ------------------------------------------------------------------ */

/** פופאפ המועדון או הפוטר. מתחיל את זרימת "ברוכים הבאים" */
export async function klaviyoSignup(input: { email: string; name?: string; phone?: string; source: 'popup' | 'footer'; code?: string; percent?: number }) {
  const [first, ...rest] = (input.name ?? '').trim().split(/\s+/);
  const day = new Date().toISOString().slice(0, 10);
  return send(
    'Mikra Signed Up',
    {
      email: input.email,
      firstName: first || undefined,
      lastName: rest.join(' ') || undefined,
      phone: input.phone,
      marketing: true,
      extra: { 'Mikra Source': input.source === 'popup' ? 'פופאפ מועדון' : 'מכתב הבית - פוטר' },
    },
    { Source: input.source, Code: input.code, Percent: input.percent, $event_id: `signup-${input.email}-${day}` },
    0,
    `signup-${input.email}-${day}`,
  );
}

/**
 * יום הולדת מהפופאפ: יום וחודש בלבד, בלי שנה. נשמר כתאריך בשנת 2000 -
 * זרימה לפי תאריך ב-Klaviyo רצה כל שנה לפי היום והחודש
 */
export async function klaviyoBirthday(input: { email: string; day: number; month: number }) {
  const mm = String(input.month).padStart(2, '0');
  const dd = String(input.day).padStart(2, '0');
  return send(
    'Mikra Birthday Set',
    { email: input.email, extra: { Birthday: `2000-${mm}-${dd}` } },
    { Birthday: `${dd}.${mm}` },
    0,
    `birthday-${input.email}-${mm}${dd}`,
  );
}

type CartLineIn = { slug: string; blessing: string; qty: number };

/** עד 5 יחידות = מלאי נמוך. null (לא נספר) - לא מציגים כלום */
function lowStock(left: number | null) {
  return left !== null && left <= 5 ? { Left: left, LowStock: true } : { LowStock: false };
}

/** עגלה של גולש מזוהה. עגלה ריקה - לא נשלח כלום (הזרימה לא מתחילה) */
export async function klaviyoCart(input: { email: string; name?: string; lines: CartLineIn[] }) {
  const items = input.lines.flatMap((l) => {
    const p = getProduct(l.slug);
    if (!p || !isBlessingId(l.blessing)) return [];
    return [
      {
        SKU: p.sku,
        ProductName: distinctName(p),
        Color: FINISHES[p.finish],
        Blessing: getBlessing(l.blessing).plain,
        Quantity: l.qty,
        RowTotal: p.price * l.qty,
        ImageURL: `${SITE_URL}${jpegImage(p)}`,
        ProductURL: `${SITE_URL}/products/${p.slug}`,
        // מלאי אמיתי לפי ברכה - מייל הדחיפות מציג אותו רק כשהוא באמת נמוך
        ...lowStock(blessingStock(p, l.blessing)),
      },
    ];
  });
  if (!items.length) return 'empty';
  const total = items.reduce((sum, i) => sum + i.RowTotal, 0);
  const restore = input.lines.map((l) => `${l.slug}:${l.blessing}:${l.qty}`).join('~');
  const sig = restore.replace(/[^a-z0-9~:-]/gi, '').slice(0, 120);
  return send(
    'Mikra Cart Updated',
    { email: input.email, firstName: input.name || undefined },
    {
      $value: total,
      Items: items,
      ItemNames: items.map((i) => i.ProductName),
      ImageURL: items[0].ImageURL,
      AnyLowStock: items.some((i) => i.LowStock),
      // הקישור ממלא את העגלה בחזרה (components/CartSync.tsx)
      CartURL: `${SITE_URL}/?restore=${encodeURIComponent(restore)}`,
    },
    total,
    `cart-${input.email}-${sig}`,
  );
}

/**
 * מה שגולש מזוהה ראה לאחרונה (/api/viewed). שני דברים:
 * - אירוע "Mikra Viewed Product" על הדגם האחרון (טריגר לזרימת "צפה ולא קנה")
 * - שדה "Mikra Recently Viewed" בפרופיל: עד 3 תכשיטים, לבלוק "התכשיטים
 *   שראית" בכל מייל. בלי צפיות - המייל מציג את המובילים במקום
 */
export async function klaviyoViewed(input: { email: string; name?: string; slugs: string[] }) {
  const items = input.slugs.flatMap((s) => {
    const p = getProduct(s);
    if (!p) return [];
    return [
      {
        ProductName: distinctName(p),
        Color: FINISHES[p.finish],
        Price: p.price,
        ImageURL: `${SITE_URL}${jpegImage(p)}`,
        ProductURL: `${SITE_URL}/products/${p.slug}`,
        Blessings: p.blessings.map((b) => getBlessing(b).plain),
      },
    ];
  });
  if (!items.length) return 'empty';
  const top = items[0];
  const hour = new Date().toISOString().slice(0, 13);
  return send(
    'Mikra Viewed Product',
    { email: input.email, firstName: input.name, extra: { 'Mikra Recently Viewed': items } },
    { ...top, $event_id: `viewed-${input.email}-${input.slugs[0]}-${hour}` },
    top.Price,
    `viewed-${input.email}-${input.slugs[0]}-${hour}`,
  );
}

/**
 * ביקורת שנשלחה מעמוד הביקורת (/api/review). מתחיל את זרימת "תודה על
 * הביקורת" ב-Klaviyo, שבה הלקוח מקבל קוד אישי של 15% להזמנה הבאה.
 *
 * ההטבה על עצם הכתיבה, לא על הציון: גם ביקורת של כוכב אחד מקבלת אותה.
 * פעם אחת לכל הזמנה (unique_id לפי ההזמנה).
 */
export async function klaviyoReview(input: { email: string; name: string; orderId: number; sku: string; rating: number }) {
  const p = getProductBySku(input.sku);
  return send(
    'Mikra Review Submitted',
    { email: input.email, firstName: input.name.split(/\s+/)[0] || undefined },
    {
      $event_id: `review-${input.orderId}`,
      Rating: input.rating,
      SKU: input.sku,
      ProductName: p ? distinctName(p) : input.sku,
      ImageURL: p ? `${SITE_URL}${jpegImage(p)}` : undefined,
      OrderId: input.orderId,
    },
    0,
    `review-${input.orderId}`,
  );
}
