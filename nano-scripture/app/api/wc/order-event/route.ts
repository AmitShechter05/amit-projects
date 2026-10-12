import { NextResponse, type NextRequest } from 'next/server';
import { wcGet, wcPost, wcPut, wcReady } from '@/lib/wc';
import { reportPurchase, metaCapiOn, ga4MpOn, type PaidOrder } from '@/lib/serverConversions';

/**
 * ווקומרס קורא לכאן בכל עדכון של הזמנה (וובהוק order.updated, הוגדר
 * ב-12.10.2026). כשההזמנה שולמה - הרכישה מדווחת למטא ולגוגל מהשרת
 * (lib/serverConversions.ts).
 *
 * לא סומכים על הגוף שנשלח: לוקחים ממנו רק את מזהה ההזמנה, וקוראים
 * אותה מחדש מווקומרס עם המפתחות שלנו. כך אין צורך בסוד משותף, ומי
 * ששולח לכאן בקשה מזויפת יכול לכל היותר לגרום לדיווח של הזמנה ששולמה
 * באמת - ופעם אחת בלבד, בגלל הסימון mikra_conversion_sent.
 */
export const dynamic = 'force-dynamic';

const PAID = ['processing', 'completed'];
const FLAG = 'mikra_conversion_sent';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let id = 0;
  try {
    id = Number((JSON.parse(raw) as { id?: unknown }).id) || 0;
  } catch {
    // הפינג של ווקומרס כשיוצרים וובהוק נשלח כטופס (webhook_id=...)
  }
  if (!id || !wcReady || !(metaCapiOn || ga4MpOn)) return NextResponse.json({ ok: true, skipped: true });

  try {
    const order = await wcGet<PaidOrder & { status: string }>(`/orders/${id}`);
    const sent = order.meta_data?.some((m) => m.key === FLAG && m.value);
    if (!PAID.includes(order.status) || sent) return NextResponse.json({ ok: true, skipped: true });

    // מסמנים לפני השליחה: העדכון הזה מפעיל את הוובהוק שוב, והקריאה השנייה
    // חייבת לראות שכבר טופל
    await wcPut(`/orders/${id}`, { meta_data: [{ key: FLAG, value: new Date().toISOString() }] });
    const r = await reportPurchase(order);
    const note = r.done.length
      ? `הרכישה דווחה מהשרת ל: ${r.done.join(', ')}.`
      : r.test
        ? 'הזמנת בדיקה - לא דווחה כרכישה.'
        : '';
    if (note || r.errors.length) {
      await wcPost(`/orders/${id}/notes`, {
        note: [note, ...r.errors.map((e) => `שגיאה בדיווח: ${e}`)].filter(Boolean).join(' '),
      });
    }
    if (r.errors.length) console.error('server conversions', id, r.errors);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error('order-event failed', id, e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
