import 'server-only';
import { wcGet, wcReady } from './wc';
import { BLESSING_KEY, type WcOrder } from './wcOrderCore';
import { getProductBySku } from './catalog';
import type { PaySummary } from '@/app/checkout/pay/GrowSheet';

/**
 * הזמנה מווקומרס לפי מזהה + מפתח, לעמודי התשלום והכישלון.
 * בלי מפתח תואם לא מוחזר כלום - אחרת כל אחד היה רואה הזמנה של אחר.
 */
/** השדות של הזמנה בווקומרס שהסיכום צריך */
export type WcFullOrder = WcOrder & {
  discount_total?: string;
  line_items?: { name: string; sku?: string; quantity: number; subtotal: string; meta_data?: { key: string; value: unknown }[] }[];
  fee_lines?: { name: string; total: string }[];
  shipping_lines?: { method_id?: string; method_title: string; total: string }[];
  shipping?: { first_name?: string; last_name?: string; address_1?: string; city?: string };
};

/** הסיכום שמוצג מאחורי חלון התשלום - מתוך ההזמנה עצמה, לא מהעגלה */
export function summarize(o: WcFullOrder): PaySummary {
  const ship = o.shipping_lines?.[0];
  const pickup = ship?.method_id === 'local_pickup';
  const to = o.shipping;
  return {
    lines: (o.line_items ?? []).map((l) => {
      const p = l.sku ? getProductBySku(l.sku) : undefined;
      const blessing = l.meta_data?.find((m) => m.key === BLESSING_KEY)?.value;
      return {
        name: p?.name ?? l.name,
        image: p?.image ?? null,
        blessing: typeof blessing === 'string' ? blessing : null,
        qty: l.quantity,
        amount: Number(l.subtotal),
      };
    }),
    fees: (o.fee_lines ?? []).map((f) => ({ name: f.name, amount: Number(f.total) })),
    shipping: ship ? { label: ship.method_title, amount: Number(ship.total) } : null,
    discount: Number(o.discount_total ?? 0),
    total: Number(o.total),
    shipTo:
      !pickup && to?.address_1
        ? { name: `${to.first_name ?? ''} ${to.last_name ?? ''}`.trim(), address: [to.address_1, to.city].filter(Boolean).join(', ') }
        : null,
  };
}

export async function findOrder(o?: string, k?: string): Promise<WcFullOrder | null> {
  const id = Number(o);
  if (!wcReady || !Number.isInteger(id) || id <= 0 || !k) return null;
  try {
    const found = await wcGet<WcFullOrder>(`/orders/${id}`);
    return found.order_key === k ? found : null;
  } catch (e) {
    console.error('order lookup failed', id, e);
    return null;
  }
}

/** הכתובת של עמוד התשלום להזמנה */
export const payPath = (o: WcOrder) => `/checkout/pay?o=${o.id}&k=${encodeURIComponent(o.order_key ?? '')}`;
