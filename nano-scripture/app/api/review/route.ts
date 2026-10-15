import { NextResponse, type NextRequest } from 'next/server';
import { wcPost, wcReady, skuToId } from '@/lib/wc';
import { findOrder } from '@/lib/paySummary';

export const dynamic = 'force-dynamic';

/**
 * POST /api/review { o, k, sku, rating, text, name } — ביקורת ממי שקנה.
 * מאמתים את ההזמנה (מספר + מפתח, ושולמה) ושהמק״ט באמת בה, ושומרים
 * בווקומרס כ"ממתינה" (status: hold). עמית מאשר בפאנל, ורק אז היא מופיעה
 * באתר (lib/reviews.ts).
 */
export async function POST(req: NextRequest) {
  if (!wcReady) return NextResponse.json({ ok: false, error: 'החנות לא מחוברת כרגע.' }, { status: 503 });
  let b: { o?: unknown; k?: unknown; sku?: unknown; rating?: unknown; text?: unknown; name?: unknown };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'בקשה לא תקינה.' }, { status: 400 });
  }
  const order = await findOrder(String(b.o ?? ''), String(b.k ?? ''));
  if (!order || !['processing', 'completed'].includes(order.status ?? '')) {
    return NextResponse.json({ ok: false, error: 'הקישור לא תקין.' }, { status: 403 });
  }
  const sku = String(b.sku ?? '');
  if (!sku || !(order.line_items ?? []).some((l) => l.sku === sku)) {
    return NextResponse.json({ ok: false, error: 'התכשיט לא נמצא בהזמנה.' }, { status: 400 });
  }
  const rating = Math.round(Number(b.rating));
  const name = String(b.name ?? '').trim().slice(0, 40);
  const text = String(b.text ?? '').trim().slice(0, 1500);
  if (!(rating >= 1 && rating <= 5) || !name) {
    return NextResponse.json({ ok: false, error: 'חסר ציון או שם.' }, { status: 400 });
  }
  const productId = (await skuToId()).get(sku);
  if (!productId) return NextResponse.json({ ok: false, error: 'התכשיט לא נמצא.' }, { status: 400 });
  const email = (order as unknown as { billing?: { email?: string } }).billing?.email ?? '';
  try {
    await wcPost('/products/reviews', {
      product_id: productId,
      review: text || '(בלי טקסט)',
      reviewer: name,
      reviewer_email: email,
      rating,
      status: 'hold',
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // אותה ביקורת פעמיים (לחיצה כפולה) - ווקומרס דוחה כפילות; מבחינת הלקוח זה נשמר
    if (/duplicate/i.test(String(e))) return NextResponse.json({ ok: true });
    console.error('review save failed', e);
    return NextResponse.json({ ok: false, error: 'לא הצלחנו לשמור את הביקורת. נסו שוב בעוד רגע.' }, { status: 502 });
  }
}
