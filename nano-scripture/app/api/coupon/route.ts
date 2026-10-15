import { NextResponse, type NextRequest } from 'next/server';
import { wcReady } from '@/lib/wc';
import { checkCoupon } from '@/lib/coupons';

export const dynamic = 'force-dynamic';

/**
 * POST /api/coupon { code } — בדיקת קוד הנחה מהעגלה (lib/coupons.ts).
 * מחזיר את הסוג והסכום, כדי שהעגלה תציג את ההנחה הנכונה. הבדיקה
 * המחייבת - כולל הכתובת שהקוד מוגבל אליה - נעשית שוב בקופה.
 */
export async function POST(req: NextRequest) {
  if (!wcReady) return NextResponse.json({ ok: false, error: 'החנות לא מחוברת כרגע.' }, { status: 503 });
  let code = '';
  try {
    code = String(((await req.json()) as { code?: unknown }).code ?? '').slice(0, 64);
  } catch {
    return NextResponse.json({ ok: false, error: 'בקשה לא תקינה.' }, { status: 400 });
  }
  const r = await checkCoupon(code);
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
