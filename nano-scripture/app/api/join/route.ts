import { NextResponse, type NextRequest } from 'next/server';
import { wcReady } from '@/lib/wc';
import { findJoinable } from '@/lib/joinServer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/join?o=<id>&k=<order_key> - האם אפשר להוסיף לחבילה של ההזמנה.
 *
 * מחזיר את פרטי הקונה כדי שהקופה תתמלא מעצמה. רק למי שמחזיק את מפתח
 * ההזמנה - אותו מפתח שווקומרס עצמו דורש כדי להציג הזמנה ללקוח.
 */
export async function GET(req: NextRequest) {
  if (!wcReady) return NextResponse.json({ error: 'החנות לא מחוברת' }, { status: 503 });
  const q = req.nextUrl.searchParams;
  const r = await findJoinable(q.get('o'), q.get('k'));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 409 });
  const o = r.order;
  const b = o.billing;
  return NextResponse.json(
    {
      id: o.id,
      number: o.number,
      placedAt: o.placedAt,
      shipping: o.shipping,
      slugs: o.slugs,
      recipient: o.recipient,
      customer: {
        firstName: b.first_name ?? '',
        lastName: b.last_name ?? '',
        email: b.email ?? '',
        phone: b.phone ?? '',
        address: b.address_1 ?? '',
        city: b.city ?? '',
        postcode: b.postcode ?? '',
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
