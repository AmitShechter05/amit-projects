import { NextResponse, type NextRequest } from 'next/server';
import { skuToId, wcPost, wcReady } from '@/lib/wc';
import type { WcOrder } from '@/lib/wcOrderCore';
import { WC_GROW_METHOD } from '@/lib/grow';

/**
 * קישור בדיקה לסליקה: כל כניסה יוצרת הזמנה חדשה של 1 ש"ח ופותחת את
 * עמוד התשלום האמיתי (חלון Grow, עמוד תודה, עמוד כישלון).
 *
 * עמית ביקש (12.10.2026) קישור קבוע לבדיקות. המוצר TEST-1ILS פרטי
 * בווקומרס ולא קיים בקטלוג של האתר, ולכן לא מופיע ללקוחות. המפתח
 * בכתובת מונע מבוטים ליצור הזמנות; במקרה הגרוע מישהו משלם לנו שקל.
 * לבטל = למחוק את הקובץ.
 */
const KEY = 's01cuG1LCzT6';
const SKU = 'TEST-1ILS';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('k') !== KEY || !wcReady) {
    return new NextResponse('Not found', { status: 404 });
  }
  const id = (await skuToId()).get(SKU);
  if (!id) return new NextResponse('מוצר הבדיקה לא נמצא בווקומרס', { status: 500 });

  const billing = {
    first_name: 'עמית',
    last_name: 'בדיקת סליקה',
    email: 'amit.haela123@gmail.com',
    phone: '0500000000',
    address_1: 'בדיקה',
    city: 'בדיקה',
    postcode: '0000000',
    country: 'IL',
  };
  const order = await wcPost<WcOrder>('/orders', {
    payment_method: WC_GROW_METHOD.id,
    payment_method_title: WC_GROW_METHOD.title,
    set_paid: false,
    status: 'pending',
    created_via: 'checkout',
    billing,
    line_items: [{ product_id: id, quantity: 1 }],
    customer_note: 'בדיקת סליקה ב-1 ש"ח (קישור הבדיקה)',
    meta_data: [{ key: '_mikra_source', value: 'payment-test' }],
  });

  const res = NextResponse.redirect(
    new URL(`/checkout/pay?o=${order.id}&k=${encodeURIComponent(order.order_key ?? '')}`, req.url),
  );
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}
