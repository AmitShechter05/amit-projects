import { NextResponse, after, type NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { PRICES_TAG } from '@/lib/livePrices';
import { wcGet, wcPost, wcPut, wcReady } from '@/lib/wc';
import { reportPurchase, metaCapiOn, ga4MpOn, type PaidOrder } from '@/lib/serverConversions';
import { klaviyoOrderEvent } from '@/lib/klaviyo';

/**
 * ווקומרס קורא לכאן בכל עדכון של הזמנה (וובהוק order.updated, הוגדר
 * ב-12.10.2026). כשההזמנה שולמה - הרכישה מדווחת למטא ולגוגל מהשרת
 * (lib/serverConversions.ts).
 *
 * לא סומכים על הגוף שנשלח: לוקחים ממנו רק את מזהה ההזמנה, וקוראים
 * אותה מחדש מווקומרס עם המפתחות שלנו. כך אין צורך בסוד משותף, ומי
 * ששולח לכאן בקשה מזויפת יכול לכל היותר לגרום לדיווח של הזמנה ששולמה
 * באמת - ופעם אחת בלבד, בגלל הסימון mikra_conversion_sent.
 */
export const dynamic = 'force-dynamic';

const PAID = ['processing', 'completed'];
const FLAG = 'mikra_conversion_sent';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let id = 0;
  try {
    id = Number((JSON.parse(raw) as { id?: unknown }).id) || 0;
  } catch {
    // הפינג של ווקומרס כשיוצרים וובהוק נשלח כטופס (webhook_id=...)
  }
  // הזמנה שהשתנתה (שולמה, בוטלה) שינתה גם מלאי. המטמון של המחירים
  // והמלאי מתרענן מיד, במקום לחכות עד חמש דקות
  if (id) {
    try {
      revalidateTag(PRICES_TAG, { expire: 0 });
    } catch (e) {
      console.error('revalidate prices/stock failed', e);
    }
  }
  if (!id || !wcReady) return NextResponse.json({ ok: true, skipped: true });

  try {
    const order = await wcGet<KOrder>(`/orders/${id}`);
    // Klaviyo אחרי מטא ולא לפני: הסימון של Klaviyo מעדכן את ההזמנה ומפעיל
    // את הוובהוק שוב, וקריאה כפולה לפני שמטא סומן הייתה מדווחת רכישה פעמיים.
    // כפילות אצל Klaviyo לא מזיקה - האירוע נושא unique_id לפי ההזמנה
    after(() => klaviyoSync(order));
    if (!(metaCapiOn || ga4MpOn)) return NextResponse.json({ ok: true, skipped: true });
    const sent = order.meta_data?.some((m) => m.key === FLAG && m.value);
    if (!PAID.includes(order.status) || sent) return NextResponse.json({ ok: true, skipped: true });

    // מסמנים לפני השליחה: העדכון הזה מפעיל את הוובהוק שוב, והקריאה השנייה
    // חייבת לראות שכבר טופל
    await wcPut(`/orders/${id}`, { meta_data: [{ key: FLAG, value: new Date().toISOString() }] });
    const r = await reportPurchase(order);
    const note = r.done.length
      ? `הרכישה דווחה מהשרת ל: ${r.done.join(', ')}.`
      : r.test
        ? 'הזמנת בדיקה - לא דווחה כרכישה.'
        : '';
    if (note || r.errors.length) {
      await wcPost(`/orders/${id}/notes`, {
        note: [note, ...r.errors.map((e) => `שגיאה בדיווח: ${e}`)].filter(Boolean).join(' '),
      });
    }
    if (r.errors.length) console.error('server conversions', id, r.errors);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error('order-event failed', id, e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

/**
 * Klaviyo: "שולם" פעם אחת לכל הזמנה, ו"נשלח" פעם אחת כשהיא הושלמה.
 * כל אחד מסומן בהזמנה לפני השליחה - כמו הדיווח למטא - כי העדכון עצמו
 * מפעיל את הוובהוק שוב. תקלה ב-Klaviyo נרשמת ולא עוצרת את הדיווח למטא.
 */
const K_PAID = 'mikra_klaviyo_paid';
const K_SHIPPED = 'mikra_klaviyo_shipped';
type KOrder = PaidOrder & { status: string; order_key?: string; date_completed_gmt?: string | null };
// הזמנות ישנות שמתעדכנות היום (הערה, החזר) לא נכנסות לזרימות באיחור של שבועות
const fresh = (gmt?: string | null) => Boolean(gmt) && Date.now() - Date.parse(`${gmt}Z`) < 3 * 86400_000;
async function klaviyoSync(order: KOrder) {
  if (!process.env.KLAVIYO_PRIVATE_KEY) return;
  const has = (k: string) => order.meta_data?.some((m) => m.key === k && m.value);
  const todo: ('paid' | 'shipped')[] = [];
  if (PAID.includes(order.status) && !has(K_PAID) && fresh(order.date_paid_gmt)) todo.push('paid');
  if (order.status === 'completed' && !has(K_SHIPPED) && fresh(order.date_completed_gmt)) todo.push('shipped');
  if (!todo.length) return;
  try {
    await wcPut(`/orders/${order.id}`, {
      meta_data: todo.map((t) => ({ key: t === 'paid' ? K_PAID : K_SHIPPED, value: new Date().toISOString() })),
    });
    for (const t of todo) await klaviyoOrderEvent(t, order);
  } catch (e) {
    console.error('klaviyo order event failed', order.id, todo, e);
  }
}
