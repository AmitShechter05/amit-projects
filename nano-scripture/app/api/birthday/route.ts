import { NextResponse, type NextRequest } from 'next/server';
import { klaviyoBirthday } from '@/lib/klaviyo';

export const dynamic = 'force-dynamic';

/**
 * POST /api/birthday { email, day, month } - השלב האופציונלי אחרי
 * ההרשמה בפופאפ (עמית, 22.11.2026: "להטבות יום הולדת").
 *
 * יום וחודש בלבד, בלי שנה: לא צריך גיל בשביל הטבה, ופחות מידע אישי זה
 * פחות מה לשמור. נשמר רק ב-Klaviyo (שדה Birthday בפרופיל).
 */
export async function POST(req: NextRequest) {
  let body: { email?: unknown; day?: unknown; month?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const email = String(body.email ?? '').trim().toLowerCase();
  const day = Number(body.day);
  const month = Number(body.month);
  const valid =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) &&
    email.length <= 120 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= new Date(2000, month, 0).getDate();
  if (!valid) return NextResponse.json({ ok: false, error: 'תאריך לא תקין' }, { status: 400 });
  try {
    await klaviyoBirthday({ email, day, month });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('birthday failed', e);
    return NextResponse.json({ ok: false, error: 'לא נשמר. נסו שוב.' }, { status: 502 });
  }
}
