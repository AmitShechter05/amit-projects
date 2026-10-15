import { NextResponse, type NextRequest } from 'next/server';
import { mikraPost, wcReady } from '@/lib/wc';
import { getProduct } from '@/lib/catalog';
import { isBlessingId } from '@/lib/blessings';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notify { slug, blessing, email } — "תודיעו לי כשחוזר".
 * הבקשה נשמרת בתוסף mikra-store (wordpress/mikra-store/includes/stock.php),
 * שגם שולח את המייל כשהמלאי של הברכה עולה מאפס.
 */
export async function POST(req: NextRequest) {
  if (!wcReady) return NextResponse.json({ ok: false, error: 'החנות לא מחוברת כרגע.' }, { status: 503 });
  let body: { slug?: unknown; blessing?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'בקשה לא תקינה.' }, { status: 400 });
  }
  const product = getProduct(String(body.slug ?? ''));
  const blessing = String(body.blessing ?? '');
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!product || !isBlessingId(blessing) || !product.blessings.includes(blessing)) {
    return NextResponse.json({ ok: false, error: 'תכשיט או ברכה לא מוכרים.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) {
    return NextResponse.json({ ok: false, error: 'כתובת המייל לא תקינה.' }, { status: 400 });
  }
  try {
    await mikraPost('/notify', { sku: product.sku, blessing, email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('notify failed', e);
    return NextResponse.json({ ok: false, error: 'לא הצלחנו לשמור את הבקשה. נסו שוב בעוד רגע.' }, { status: 502 });
  }
}
