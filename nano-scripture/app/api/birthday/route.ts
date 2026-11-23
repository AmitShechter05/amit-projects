import { NextResponse, type NextRequest } from 'next/server';
import { klaviyoBirthday, klaviyoName } from '@/lib/klaviyo';

export const dynamic = 'force-dynamic';

/**
 * POST /api/birthday { email, name?, day?, month? } - השלב האופציונלי אחרי
 * ההרשמה בפופאפ (עמית, 22.11.2026: "להטבות יום הולדת").
 *
 * יום וחודש בלבד, בלי שנה: לא צריך גיל בשביל הטבה, ופחות מידע אישי זה
 * פחות מה לשמור. נשמר רק ב-Klaviyo (שדה Birthday בפרופיל).
 */
export async function POST(req: NextRequest) {
  let body: { email?: unknown; day?: unknown; month?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const email = String(body.email ?? '').trim().toLowerCase();
  const day = Number(body.day);
  const month = Number(body.month);
  // מ-23.11: המסך השני של הפופאפ שולח רק שם, רק תאריך, או את שניהם
  const name = String(body.name ?? '').trim().split(/\s+/)[0].slice(0, 40);
  const hasDate = Boolean(body.day || body.month);
  const dateOk =
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= new Date(2000, month, 0).getDate();
  const valid =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 120 && (hasDate ? dateOk : name.length >= 2);
  if (!valid) return NextResponse.json({ ok: false, error: 'פרטים לא תקינים' }, { status: 400 });
  try {
    if (hasDate) await klaviyoBirthday({ email, day, month, name: name || undefined });
    else await klaviyoName({ email, name });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('birthday failed', e);
    return NextResponse.json({ ok: false, error: 'לא נשמר. נסו שוב.' }, { status: 502 });
  }
}
