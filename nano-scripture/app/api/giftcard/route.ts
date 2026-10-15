import { NextResponse, type NextRequest } from 'next/server';
import { wcGet, wcPost, wcReady } from '@/lib/wc';
import { WC_GROW_METHOD } from '@/lib/grow';
import { normalizePhone } from '@/lib/checkout';
import { GIFT_AMOUNTS, giftSku, type GiftAmount } from '@/lib/giftcard';

export const dynamic = 'force-dynamic';

/**
 * POST /api/giftcard — הזמנת כרטיס מתנה (lib/giftcard.ts).
 *
 * יוצר הזמנה בווקומרס עם המוצר הווירטואלי, בלי משלוח, ומחזיר את עמוד
 * התשלום שלנו. פרטי המקבל נשמרים על ההזמנה; את הקוד יוצר ושולח התוסף
 * כשההזמנה שולמה. created_via אינו 'checkout', כדי שזרימת הנטישה לא
 * תשלח עליה מיילים של "התכשיט שלך מחכה".
 */
type Body = {
  amount?: unknown;
  buyer?: { firstName?: unknown; lastName?: unknown; email?: unknown; phone?: unknown };
  to?: { name?: unknown; email?: unknown };
  from?: unknown;
  message?: unknown;
  sendDate?: unknown;
  terms?: unknown;
  marketing?: unknown;
};

const str = (v: unknown, max = 120) => String(v ?? '').trim().slice(0, max);
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

export async function POST(req: NextRequest) {
  if (!wcReady) return NextResponse.json({ error: 'החנות לא מחוברת כרגע.' }, { status: 503 });
  let b: Body;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה.' }, { status: 400 });
  }
  const amount = Number(b.amount) as GiftAmount;
  if (!GIFT_AMOUNTS.includes(amount)) return NextResponse.json({ error: 'סכום לא תקין.' }, { status: 400 });

  const first = str(b.buyer?.firstName, 40);
  const last = str(b.buyer?.lastName, 40);
  const email = str(b.buyer?.email).toLowerCase();
  const phone = normalizePhone(str(b.buyer?.phone, 20));
  const toName = str(b.to?.name, 60);
  const toEmail = str(b.to?.email).toLowerCase();
  const from = str(b.from, 60) || first;
  const message = str(b.message, 400);
  const sendDate = /^\d{4}-\d{2}-\d{2}$/.test(str(b.sendDate, 10)) ? str(b.sendDate, 10) : '';

  const fields: Record<string, string> = {};
  if (!first) fields.firstName = 'חסר שם פרטי';
  if (!isEmail(email)) fields.email = 'כתובת המייל לא תקינה';
  if (!/^0\d{8,9}$/.test(phone)) fields.phone = 'מספר הטלפון לא תקין';
  if (!toName) fields.toName = 'למי המתנה?';
  if (!isEmail(toEmail)) fields.toEmail = 'כתובת המייל של המקבל לא תקינה';
  if (b.terms !== true) fields.terms = 'צריך לאשר את התקנון';
  if (Object.keys(fields).length) return NextResponse.json({ error: 'פרטים חסרים או שגויים', fields }, { status: 400 });

  try {
    const found = await wcGet<{ id: number }[]>('/products', { sku: giftSku(amount), per_page: 1 });
    if (!found[0]) throw new Error(`missing product ${giftSku(amount)}`);
    const order = await wcPost<{ id: number; order_key: string }>('/orders', {
      payment_method: WC_GROW_METHOD.id,
      payment_method_title: WC_GROW_METHOD.title,
      set_paid: false,
      status: 'pending',
      created_via: 'mikra-giftcard',
      currency: 'ILS',
      billing: { first_name: first, last_name: last, email, phone, country: 'IL' },
      line_items: [{ product_id: found[0].id, quantity: 1 }],
      meta_data: [
        { key: '_mikra_source', value: 'giftcard' },
        { key: '_mikra_gift_to_name', value: toName },
        { key: '_mikra_gift_to_email', value: toEmail },
        { key: '_mikra_gift_from', value: from },
        { key: '_mikra_gift_message', value: message },
        { key: '_mikra_gift_date', value: sendDate },
        { key: 'כרטיס מתנה', value: `₪${amount} ל-${toName} (${toEmail})${sendDate ? `, יישלח ב-${sendDate}` : ''}` },
        { key: 'אישור תקנון', value: new Date().toISOString() },
        { key: 'הסכמה לדיוור', value: b.marketing === true ? 'כן' : 'לא' },
      ],
    });
    return NextResponse.json({ payment: `/checkout/pay?o=${order.id}&k=${encodeURIComponent(order.order_key)}` });
  } catch (e) {
    console.error('giftcard order failed', e);
    return NextResponse.json({ error: 'לא הצלחנו ליצור את ההזמנה. נסו שוב בעוד רגע, או כתבו לנו.' }, { status: 502 });
  }
}
