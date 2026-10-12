import 'server-only';
import { createHash, randomInt } from 'node:crypto';
import { GA_ID, PIXEL_ID } from './analytics';

/**
 * דיווח רכישה מהשרת: Conversions API של מטא, ו-Measurement Protocol של
 * גוגל אנליטיקס.
 *
 * ------------------------------------------------------------------
 * למה (עמית, 12.10.2026): הרכישה נמדדה רק מעמוד התודה, בדפדפן. שני
 * מקרים מפספסים אותה לגמרי:
 *   - מי שלא אישר עוגיות - הפיקסל לא נטען אצלו בכלל;
 *   - מי שמשלם ב-bit מתוך אינסטגרם/פייסבוק - bit מחזיר אותו לספארי, לעמוד
 *     של Grow, והוא לא מגיע לעמוד התודה (תשובת Grow, 12.10.2026).
 * כאן הרכישה נשלחת ברגע שווקומרס מסמן את ההזמנה כמשולמת
 * (app/api/wc/order-event), בלי קשר למה שקרה בדפדפן.
 * ------------------------------------------------------------------
 *
 * כפילות: הדפדפן שולח Purchase עם eventID = מספר ההזמנה
 * (lib/analytics.ts, trackPurchase), וכאן event_id זהה - מטא מאחדת את
 * שניהם לרכישה אחת. בגוגל transaction_id זהה עושה את אותו דבר.
 *
 * נדלק בהגדרה: בלי META_CAPI_TOKEN / GA4_API_SECRET בסביבה - לא נשלח כלום.
 */
const META_TOKEN = process.env.META_CAPI_TOKEN || '';
const GA_SECRET = process.env.GA4_API_SECRET || '';
/** קוד מ"אירועי בדיקה" במטא. כשהוא מוגדר, הזמנות בדיקה נשלחות לשם בלבד */
const META_TEST_CODE = process.env.META_TEST_EVENT_CODE || '';
const GRAPH = 'https://graph.facebook.com/v23.0';

export const metaCapiOn = Boolean(META_TOKEN && PIXEL_ID);
export const ga4MpOn = Boolean(GA_SECRET && GA_ID);

/** שדות ההזמנה מווקומרס שהדיווח צריך */
export type PaidOrder = {
  id: number;
  number: string;
  total: string;
  currency?: string;
  date_paid_gmt?: string | null;
  billing?: { first_name?: string; last_name?: string; email?: string; phone?: string; city?: string; country?: string };
  line_items?: { sku?: string; name: string; quantity: number; total: string; price?: number }[];
  meta_data?: { key: string; value: unknown }[];
};

const sha = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex');
const meta = (o: PaidOrder, k: string) => {
  const v = o.meta_data?.find((m) => m.key === k)?.value;
  return typeof v === 'string' && v ? v : undefined;
};

/** 050-1234567 -> 972501234567 */
function phoneE164(raw?: string) {
  const d = (raw ?? '').replace(/\D/g, '');
  if (!d) return undefined;
  if (d.startsWith('972')) return d;
  if (d.startsWith('0')) return `972${d.slice(1)}`;
  return d;
}

/** הזמנת בדיקה - כל הפריטים במק"ט TEST */
export const isTestOrder = (o: PaidOrder) =>
  (o.line_items ?? []).length > 0 && (o.line_items ?? []).every((l) => (l.sku ?? '').startsWith('TEST'));

async function sendMeta(o: PaidOrder, test: boolean) {
  const b = o.billing ?? {};
  const user: Record<string, unknown> = {
    em: b.email ? [sha(b.email)] : undefined,
    ph: phoneE164(b.phone) ? [sha(phoneE164(b.phone)!)] : undefined,
    fn: b.first_name ? [sha(b.first_name)] : undefined,
    ln: b.last_name ? [sha(b.last_name)] : undefined,
    ct: b.city ? [sha(b.city.replace(/\s+/g, ''))] : undefined,
    country: [sha((b.country || 'IL').toLowerCase())],
    external_id: b.email ? [sha(b.email)] : undefined,
    client_ip_address: meta(o, 'mikra_ip'),
    client_user_agent: meta(o, 'mikra_ua'),
    fbp: meta(o, 'mikra_fbp'),
    fbc: meta(o, 'mikra_fbc'),
  };
  for (const k of Object.keys(user)) if (user[k] === undefined) delete user[k];

  const paidAt = o.date_paid_gmt ? Date.parse(`${o.date_paid_gmt}Z`) : Date.now();
  const items = o.line_items ?? [];
  const body = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor((Number.isFinite(paidAt) ? paidAt : Date.now()) / 1000),
        event_id: String(o.number),
        action_source: 'website',
        event_source_url: 'https://mikra.shop/checkout/success',
        user_data: user,
        custom_data: {
          currency: o.currency || 'ILS',
          value: Number(o.total),
          content_type: 'product',
          content_ids: items.map((l) => l.sku).filter(Boolean),
          contents: items.map((l) => ({ id: l.sku, quantity: l.quantity, item_price: Number(l.total) / (l.quantity || 1) })),
          num_items: items.reduce((s, l) => s + l.quantity, 0),
          order_id: String(o.number),
        },
      },
    ],
    ...(test ? { test_event_code: META_TEST_CODE } : {}),
  };
  const res = await fetch(`${GRAPH}/${PIXEL_ID}/events?access_token=${encodeURIComponent(META_TOKEN)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta CAPI ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 200);
}

async function sendGa(o: PaidOrder) {
  // מזהה הדפדפן מהעוגייה _ga, כדי שהרכישה תשויך לביקור; אם אין - מזהה חדש
  const cid = meta(o, 'mikra_ga_cid') || `${randomInt(1e9, 2e9)}.${Math.floor(Date.now() / 1000)}`;
  const body = {
    client_id: cid,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: String(o.number),
          currency: o.currency || 'ILS',
          value: Number(o.total),
          items: (o.line_items ?? []).map((l) => ({
            item_id: l.sku,
            item_name: l.name,
            quantity: l.quantity,
            price: Number(l.total) / (l.quantity || 1),
          })),
        },
      },
    ],
  };
  const res = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(GA_ID)}&api_secret=${encodeURIComponent(GA_SECRET)}`,
    { method: 'POST', body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(15_000) },
  );
  if (!res.ok) throw new Error(`GA4 MP ${res.status}`);
  return 'ok';
}

/**
 * שולח את הרכישה. מחזיר מה נשלח לאן, לרישום בהערת ההזמנה.
 * הזמנת בדיקה: לגוגל לא נשלחת בכלל, ולמטא רק ל"אירועי בדיקה" (אם הוגדר קוד).
 */
export async function reportPurchase(o: PaidOrder) {
  const test = isTestOrder(o);
  const done: string[] = [];
  const errors: string[] = [];

  if (metaCapiOn && (!test || META_TEST_CODE)) {
    try {
      await sendMeta(o, test);
      done.push(test ? 'מטא (אירועי בדיקה)' : 'מטא');
    } catch (e) {
      errors.push(String(e));
    }
  }
  if (ga4MpOn && !test) {
    try {
      await sendGa(o);
      done.push('גוגל אנליטיקס');
    } catch (e) {
      errors.push(String(e));
    }
  }
  return { done, errors, test };
}
