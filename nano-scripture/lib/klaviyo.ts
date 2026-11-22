import 'server-only';
import { getProduct, getProductBySku, FINISHES } from './catalog';
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

type Profile = { email: string; firstName?: string; lastName?: string; phone?: string; marketing?: boolean };

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
              ...(profile.marketing === undefined
                ? {}
                : { properties: { 'Mikra Marketing Consent': Boolean(profile.marketing) } }),
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
