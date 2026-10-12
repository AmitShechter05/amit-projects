import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { WhatsAppIcon } from '@/components/WhatsAppFab';
import { POLICY, deliveryLine, dispatchLine } from '@/lib/policy';
import { COMPANY, telHref, waHref } from '@/lib/company';
import OrderDone from './OrderDone';
import BreakOut from './BreakOut';

export const metadata: Metadata = {
  title: 'ההזמנה התקבלה',
  // עמוד אישי שנוצר אחרי הזמנה. אין לו מה לחפש בתוצאות החיפוש
  robots: { index: false, follow: false },
};

/**
 * עמוד התודה — הסוף של המסע, לשני מסלולי התשלום.
 *
 * ------------------------------------------------------------------
 * הוא לא היה קיים, וזה היה 404 ברגע הכי גרוע שאפשר.
 *
 * ה-successUrl שנשלח לסולק הצביע על נתיב שלא נבנה. כלומר לקוח היה
 * מזין אשראי, משלם, ונוחת על דף שגיאה - בלי אישור, בלי מספר הזמנה,
 * ובלי לדעת אם הכסף ירד. זו החוויה שמייצרת פנייה לחברת האשראי.
 *
 * ואחר כך הוא כן היה קיים, אבל ידע להגיד מספר הזמנה בלבד. עכשיו
 * הוא מציג גם את מה שנקנה - הדגם, הנוסח שנבחר והסכום - ואליו מגיעים
 * גם מהמסלול הידני, כדי שיהיה עמוד תודה אחד ולא שניים שנבדלים זה מזה.
 * ------------------------------------------------------------------
 *
 * מה שכתוב כאן נזהר בניסוח: הדף מאשר שההזמנה התקבלה, ולא מצהיר
 * שהכסף נגבה. הגבייה מאושרת בשרת מול הסולק, ולא בדפדפן של הלקוח.
 */
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; sum?: string }>;
}) {
  const { order, sum } = await searchParams;
  const paid = Number(sum);

  // ההודעה בוואטסאפ נפתחת עם מספר ההזמנה, כדי שלא נצטרך לשאול
  const wa =
    waHref && `${waHref}?text=${encodeURIComponent(order ? `שלום, לגבי הזמנה #${order}` : 'שלום, לגבי ההזמנה שלי')}`;

  /**
   * עמית (12.10.2026): תמונה של הדוגמנים בגודל רגיל, הכיתוב של ההזמנה,
   * מספר ההזמנה, וכפתור וואטסאפ עם הלוגו - במקום כותרת ענקית על דף ריק.
   * בטלפון התמונה למעלה ברצועה נמוכה; במחשב היא עמודה ליד התוכן.
   */
  return (
    <section className="pb-24 pt-28 md:pb-32 md:pt-36">
      <BreakOut />
      <div className="shell grid max-w-5xl items-start gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-14">
        <div
          className="relative aspect-[4/3] overflow-hidden md:sticky md:top-28 md:aspect-[4/5]"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          <Image
            src="/hero/hero-portrait.jpg"
            alt="זוג עונד תכשיטי מִקְרָא"
            fill
            priority
            sizes="(min-width: 768px) 420px, 100vw"
            className="object-cover"
            style={{ objectPosition: '50% 18%' }}
          />
        </div>

        <div>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 600 }}>תודה שקניתם אצלנו</p>
          <h1 className="display t-2 mt-2">ההזמנה התקבלה</h1>
          <p className="mt-3" style={{ fontSize: 'var(--fs-base)', color: 'var(--ink-2)' }}>
            שלחנו אישור לאימייל. מכאן אנחנו מטפלים בהכל.
          </p>

          <OrderDone order={order} sum={Number.isFinite(paid) && paid > 0 ? paid : undefined} />

          {/* ---------- מה קורה עכשיו ---------- */}
          <h2 className="display mt-10" style={{ fontSize: 'var(--fs-md)' }}>
            מה קורה עכשיו
          </h2>

          <ol className="mt-4 flex flex-col gap-4">
            {[
              ['חורטים את הברכה', 'את השבב חורטים לפי ההזמנה, ובודקים אותו מול הטקסט המקורי, אות אחרי אות, לפני שהוא נכנס לתכשיט.'],
              ['אורזים', 'בקופסה מרופדת, עם כרטיס שיש בו שם הברכה, מאיפה היא לקוחה, והברכה המלאה.'],
              ['שולחים', `${dispatchLine}, ומגיעה תוך ${deliveryLine} מיום המשלוח. המשלוח מבוטח.`],
            ].map(([h, p], i) => (
              <li key={h} className="flex gap-3">
                <span
                  className="flex-shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--line-strong)',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--ink-3)',
                  }}
                >
                  {'אבג'[i]}
                </span>
                <span>
                  <span className="display block" style={{ fontSize: 'var(--fs-base)' }}>
                    {h}
                  </span>
                  <span className="mt-0.5 block" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
                    {p}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div
            className="mt-8 p-5"
            style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)' }}
          >
            <p className="display" style={{ fontSize: 'var(--fs-base)' }}>
              שאלה? רוצים להחליף ברכה?
            </p>
            <p className="mt-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
              אפשר להחליף ברכה כל עוד ההזמנה לא נשלחה. אחרי המשלוח אפשר להחזיר תוך {POLICY.returnDays} יום.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn inline-flex items-center gap-2"
                  style={{ background: '#25d366', borderColor: '#25d366', color: '#fff' }}
                >
                  <WhatsAppIcon size={20} />
                  כתבו לנו בוואטסאפ
                </a>
              )}
              {telHref && (
                <a href={telHref} className="btn">
                  <span className="ltr num">{COMPANY.phone}</span>
                </a>
              )}
            </div>
          </div>

          <Link href="/catalog" className="btn btn-solid mt-6 w-full">
            המשך לקטלוג
          </Link>
        </div>
      </div>
    </section>
  );
}
