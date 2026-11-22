import { NextResponse, type NextRequest } from 'next/server';
import { findOrder, payPath } from '@/lib/paySummary';
import { wcPut } from '@/lib/wc';

export const dynamic = 'force-dynamic';

/**
 * GET /checkout/apply?o=<מזהה>&k=<מפתח>&c=<קוד> - הכפתור במייל ההנחה.
 *
 * ------------------------------------------------------------------
 * למה (22.11.2026): מיילי הנטישה עברו ל-Klaviyo, ושם כל לקוח מקבל קוד
 * אישי (BRACHA-XXXXXXXXXX) שנוצר בווקומרס. הכפתור במייל מוביל לעמוד
 * התשלום של ההזמנה שכבר קיימת - ושם אין שדה לקוד. לכן הקוד נכנס
 * להזמנה כאן, בשרת, ורק אז הלקוח ממשיך לתשלום. זה מה שהתוסף עשה
 * ב-mikra_apply, רק שהקוד מגיע בכתובת ולא שמור בהזמנה.
 * ------------------------------------------------------------------
 *
 * מפתח ההזמנה חובה, כמו בעמוד התשלום. כל תקלה - קוד שפג, שכבר נוצל,
 * הזמנה שכבר יש עליה קופון - לא עוצרת את הלקוח: הוא ממשיך לתשלום בלי
 * ההנחה, וזה נרשם בלוג.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const order = await findOrder(q.get('o') ?? undefined, q.get('k') ?? undefined);
  if (!order) return NextResponse.redirect(new URL('/checkout', req.url));

  const code = (q.get('c') ?? '').trim().toLowerCase();
  const open = ['pending', 'failed'].includes(order.status ?? '');
  const has = (order as { coupon_lines?: { code: string }[] }).coupon_lines ?? [];

  if (open && /^[a-z0-9_-]{4,40}$/.test(code) && !has.length) {
    try {
      await wcPut(`/orders/${order.id}`, { coupon_lines: [{ code }] });
    } catch (e) {
      console.error('apply code failed', order.id, code, e);
    }
  }
  return NextResponse.redirect(new URL(payPath(order), req.url));
}
