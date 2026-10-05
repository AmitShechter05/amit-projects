import type { Metadata } from 'next';
import { BLESSINGS } from '@/lib/blessings';
import BlessingCard from '@/components/BlessingCard';
import NanoLoupe from '@/components/NanoLoupe';

export const metadata: Metadata = {
  title: 'חמש הברכות',
  alternates: { canonical: '/blessings' },
  description:
    'חמש הברכות שאפשר לבחור לשבב: ברכת התינוק, ברכת הפרנסה, הברכה שלך, שמירה והגנה, ואשת חיל. כל ברכה מופיעה כאן במלואה, בלי קיצורים.',
  openGraph: {
    type: 'website',
    url: '/blessings',
    title: 'חמש הברכות · מִקְרָא',
    description: 'חמש ברכות לבחירה, כל אחת במלואה. את הברכה בוחרים בעמוד של התכשיט.',
    images: [{ url: '/scene/pair-trio.jpg', alt: 'שלושה תליונים של מִקְרָא' }],
  },
};

export default function BlessingsPage() {
  return (
    <>
      <section className="pt-40 pb-14">
        <div className="shell">
          <h1 className="display t-hero">
            <span className="mask-line load">
              <span>חמש ברכות.</span>
            </span>
            <span className="mask-line load">
              <span className="accent-text" style={{ ['--d' as string]: '130ms' }}>
                אחת שלכם.
              </span>
            </span>
          </h1>
          {/* בלי שורת מספרים. "5 נוסחים" הוא מה שהכותרת אומרת, וסך המילים
              ושטח הצריבה כבר יושבים בעמוד הבית - כאן זו הייתה חזרה בתבנית */}
          <p className="lede reveal load mt-8 max-w-2xl" style={{ ['--d' as string]: '280ms' }}>
            על כל תכשיט אפשר לבחור ברכה אחת או יותר מתוך החמש. אילו ברכות - כתוב
            בעמוד של התכשיט, ושם גם בוחרים. את השבב חורטים אחרי ההזמנה. הברכות
            מופיעות כאן במלואן, מילה במילה, בלי קיצורים ובלי שינויים.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="shell">
          {/* הלוח ריבועי כמו השבב. עמית (24.9.2026): "תקטין את המסגרת בהתאם" -
              לוח ברוחב מלא השאיר ריבוע טקסט קטן במרכז של רצועה כהה ריקה.
              "הגדלה פי 9" ירד מהכיתוב: מקדם ההגדלה של העדשה נגזר בזמן ריצה
              מגודל האות, ואינו 9 */}
          <div className="mx-auto w-full" style={{ maxWidth: 520, aspectRatio: '1' }}>
            <NanoLoupe blessing={BLESSINGS[0].id} height="100%" />
          </div>
          <p className="mt-4 text-center" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
            הדמיה של השבב · {BLESSINGS[0].plain}
          </p>
        </div>
      </section>

      {/* אינדקס, לא רשת. חמש שורות על קו אחד, כמו תוכן עניינים -
          המילים הן הגיבור, ולא הקופסה שסביבן */}
      <section className="pb-32">
        <div className="shell" style={{ borderBottom: '1px solid var(--line)' }}>
          {BLESSINGS.map((b, i) => (
            <BlessingCard key={b.id} blessing={b} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
