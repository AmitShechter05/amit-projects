import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { growWalletToken } from '@/lib/grow';
import { findOrder, summarize, payPath, type WcFullOrder } from '@/lib/paySummary';
import GrowSheet from './GrowSheet';

export const metadata: Metadata = {
  title: 'תשלום מאובטח',
  robots: { index: false, follow: false },
};

/**
 * עמוד התשלום: חלון התשלום של Grow נפתח כאן, מעל העמוד שלנו.
 *
 * עמית (12.10.2026): "למה אתה לא עושה את זה כמו בוואן זון?". ב-OneZone
 * טופס הסולק עצמו מוצג בתוך הקופה. כאן זה אותו רעיון: השרת מבקש
 * מהתוסף של Grow אסימון להזמנה (lib/grow.ts), וה-SDK של Grow פותח את
 * החלון שלהם - בלי דף "שלם עבור ההזמנה" של וורדפרס.
 *
 * הכתובת היא ?o=<מזהה>&k=<מפתח ההזמנה>. בלי מפתח תואם לא נוצר אסימון,
 * אחרת כל אחד היה יכול לפתוח תשלום על הזמנה של מישהו אחר.
 */
export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string; k?: string }>;
}) {
  const { o, k } = await searchParams;
  const order: WcFullOrder | null = await findOrder(o, k);
  let token: string | null = null;

  // כבר שולם (למשל חזרה אחורה אחרי התשלום) - לא פותחים תשלום שני
  if (order && ['processing', 'completed', 'on-hold'].includes(order.status ?? '')) {
    redirect(`/checkout/success?order=${encodeURIComponent(order.number)}`);
  }

  if (order && ['pending', 'failed'].includes(order.status ?? '')) {
    try {
      token = await growWalletToken(order.id);
    } catch (e) {
      console.error('pay page: grow token failed', order.id, e);
    }
  }

  return (
    <section className="pb-24 pt-32 md:pt-40">
      <div className="shell">
        {order && token ? (
          <GrowSheet token={token} number={order.number} path={payPath(order)} summary={summarize(order)} />
        ) : order?.status === 'cancelled' ? (
          // ווקומרס מבטל הזמנה שלא שולמה תוך 30 דקות. העגלה עדיין שמורה
          // בדפדפן (היא מתרוקנת רק בעמוד התודה), אז חוזרים לקופה
          <div className="mx-auto max-w-lg text-center">
            <h1 className="display t-2">ההזמנה פגה</h1>
            <p className="lede mt-4">
              הזמנה <span className="num">#{order.number}</span> לא שולמה תוך חצי שעה, ולכן בוטלה. לא חויבתם. אפשר
              להזמין שוב מהעגלה.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/checkout" className="btn btn-solid">
                חזרה לקופה
              </Link>
              <Link href="/catalog" className="btn">
                לקטלוג
              </Link>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-lg text-center">
            <h1 className="display t-2">לא הצלחנו לפתוח את התשלום</h1>
            <p className="lede mt-4">
              {order
                ? `ההזמנה #${order.number} נשמרה. נסו שוב בעוד רגע, או כתבו לנו בוואטסאפ ונשלח קישור לתשלום.`
                : 'לא מצאנו את ההזמנה. כתבו לנו בוואטסאפ ונעזור.'}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {order && (
                <Link href={payPath(order)} className="btn btn-solid">
                  לנסות שוב
                </Link>
              )}
              <Link href="/" className="btn">
                לדף הבית
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
