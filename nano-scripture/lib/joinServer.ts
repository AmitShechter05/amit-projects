import 'server-only';
import { wcGet } from './wc';
import { getProductBySku } from './catalog';
import { sameDispatch } from './join';
import type { ShippingMethodId } from './policy';

/**
 * בדיקת הצטרפות לחבילה, בשרת. הצד של הדפדפן ב-lib/join.ts.
 *
 * הזמנה מצטרפת רק אם: המפתח תואם (רק מי שקיבל את ההזמנה מחזיק אותו),
 * ההזמנה שולמה או נקלטה במסלול הידני, היא עוד לא נשלחה, ושתיהן יוצאות
 * באותו יום משלוח. כל השאר - הזמנה רגילה עם דמי משלוח.
 */
type WcAddress = Record<string, string>;
type WcOrderFull = {
  id: number;
  number: string;
  order_key: string;
  status: string;
  date_created_gmt: string;
  billing: WcAddress;
  shipping: WcAddress;
  shipping_lines: { method_id: string }[];
  line_items: { sku?: string }[];
  meta_data: { key: string; value: unknown }[];
};

export type Joinable = {
  id: number;
  number: string;
  placedAt: string;
  shipping: ShippingMethodId;
  billing: WcAddress;
  shippingAddress: WcAddress;
  /** הדגמים שבהזמנה, להצעת "עוד תכשיט בשבילה" */
  slugs: string[];
  /** הנמען, כשההזמנה המקורית נשלחת למישהו אחר */
  recipient: string | null;
};

export async function findJoinable(
  id: unknown,
  key: unknown,
): Promise<{ ok: true; order: Joinable } | { ok: false; error: string }> {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0 || typeof key !== 'string' || !key.startsWith('wc_order_')) {
    return { ok: false, error: 'הקישור לא תקין.' };
  }
  let o: WcOrderFull;
  try {
    o = await wcGet<WcOrderFull>(`/orders/${n}`);
  } catch {
    return { ok: false, error: 'לא מצאנו את ההזמנה.' };
  }
  if (o.order_key !== key) return { ok: false, error: 'לא מצאנו את ההזמנה.' };
  if (o.status !== 'processing' && o.status !== 'on-hold') {
    return { ok: false, error: 'ההזמנה הזו כבר נשלחה או לא שולמה, ואי אפשר להוסיף אליה.' };
  }
  const placed = new Date(o.date_created_gmt + 'Z');
  if (!sameDispatch(placed)) {
    return { ok: false, error: 'החבילה כבר יצאה למשלוח. אפשר להזמין כרגיל.' };
  }
  const method = o.shipping_lines[0]?.method_id ?? '';
  const recipient = o.meta_data.find((m) => m.key === 'משלוח לנמען')?.value;
  return {
    ok: true,
    order: {
      id: o.id,
      number: o.number,
      placedAt: placed.toISOString(),
      shipping: method === 'local_pickup' ? 'pickup' : 'delivery',
      billing: o.billing,
      shippingAddress: o.shipping,
      slugs: o.line_items.flatMap((l) => {
        const p = l.sku ? getProductBySku(l.sku) : undefined;
        return p ? [p.slug] : [];
      }),
      recipient: typeof recipient === 'string' ? recipient : null,
    },
  };
}
