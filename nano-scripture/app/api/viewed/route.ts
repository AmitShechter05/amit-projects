import { NextResponse, type NextRequest } from 'next/server';
import { getProduct } from '@/lib/catalog';
import { klaviyoViewed } from '@/lib/klaviyo';

export const dynamic = 'force-dynamic';

/**
 * POST /api/viewed { email, name?, slugs[] } - התכשיטים האחרונים שגולש
 * מזוהה ראה (lib/viewed.ts). השמות, התמונות והמחירים נבנים כאן מהקטלוג,
 * לא מהדפדפן.
 */
export async function POST(req: NextRequest) {
  let body: { email?: unknown; name?: unknown; slugs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const slugs = (Array.isArray(body.slugs) ? body.slugs : [])
    .map((s) => String(s))
    .filter((s, i, a) => getProduct(s) && a.indexOf(s) === i)
    .slice(0, 3);
  if (!slugs.length) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await klaviyoViewed({ email, name: String(body.name ?? '').slice(0, 60) || undefined, slugs });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('klaviyo viewed failed', e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
