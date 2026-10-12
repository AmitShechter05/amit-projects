import { NextResponse, type NextRequest } from 'next/server';
import { findOrder } from '@/lib/paySummary';

/**
 * מצב ההזמנה, לעמוד התשלום.
 *
 * עמית (12.10.2026): שילם ב-bit, וחזר לאתר בלי שעבר לעמוד התודה.
 * בטלפון bit נפתח באפליקציה, והאירוע של Grow לא תמיד מגיע לעמוד
 * כשחוזרים לדפדפן. לכן עמוד התשלום שואל כאן בעצמו אם ההזמנה שולמה
 * (התוסף מעדכן אותה בווקומרס ברגע שהכסף עובר).
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const order = await findOrder(q.get('o') ?? undefined, q.get('k') ?? undefined);
  if (!order) return NextResponse.json({ status: null }, { status: 404 });
  const paid = ['processing', 'completed', 'on-hold'].includes(order.status ?? '');
  return NextResponse.json(
    { status: order.status, paid, number: order.number, total: Number(order.total) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
