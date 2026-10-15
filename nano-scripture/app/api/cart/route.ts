import { NextResponse, type NextRequest } from 'next/server';
import { mikraPost, wcReady } from '@/lib/wc';
import { getProduct } from '@/lib/catalog';
import { syncPrices } from '@/lib/livePrices';
import { BLESSING_BY_ID, isBlessingId } from '@/lib/blessings';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cart { email, name?, lines } — העגלה של גולש מזוהה, לעגלה נטושה
 * לפני הקופה (wordpress/mikra-store/includes/cart.php).
 *
 * השמות, המק"טים והמחירים נבנים כאן מהקטלוג ולא נלקחים מהדפדפן, והתוסף
 * שולח רק למי שאישר דיוור - כך שאי אפשר לשלוח דרך זה מייל למישהו אחר.
 */
export async function POST(req: NextRequest) {
  if (!wcReady) return NextResponse.json({ ok: false }, { status: 503 });
  let body: { email?: unknown; name?: unknown; lines?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await syncPrices();
  const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, 20).flatMap((raw) => {
    const l = raw as { slug?: unknown; blessing?: unknown; qty?: unknown };
    const p = getProduct(String(l.slug ?? ''));
    const b = String(l.blessing ?? '');
    if (!p || !isBlessingId(b) || !p.blessings.includes(b)) return [];
    return [
      {
        slug: p.slug,
        sku: p.sku,
        name: p.name,
        blessing: b,
        blessingName: BLESSING_BY_ID[b].plain,
        qty: Math.max(1, Math.min(20, Number(l.qty) || 1)),
        price: p.price,
      },
    ];
  });
  try {
    await mikraPost('/cart', { email, name: String(body.name ?? '').slice(0, 60), lines });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('cart sync failed', e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
