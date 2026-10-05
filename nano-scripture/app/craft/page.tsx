import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Process from '@/components/home/Process';
import NanoLoupe from '@/components/NanoLoupe';
import ZoomLadder from '@/components/ZoomLadder';
import { wornFor, wornFocus } from '@/lib/worn';
import { BLESSINGS, LONGEST_BLESSING_CHARS } from '@/lib/blessings';
import Accordion, { type QA } from '@/components/Accordion';
import { deliveryLine, dispatchLine } from '@/lib/policy';

export const metadata: Metadata = {
  title: 'הטכנולוגיה',
  alternates: { canonical: '/craft' },
  description:
    'איך חורטים ברכה שלמה באותיות של 0.035 מילימטר: חריטה בלייזר, בדיקה של כל אות מול הטקסט המקורי, והכנסת השבב לתכשיט.',
  openGraph: {
    type: 'website',
    url: '/craft',
    title: 'הטכנולוגיה · מִקְרָא',
    description: 'איך חורטים ברכה שלמה על שבב, ואיך בודקים שהיא מדויקת.',
    images: [{ url: '/scene/lo-yanum-hand.jpg', alt: 'השבב בין האצבעות' }],
  },
};

const SPECS = [
  // תשובת המפעל (17.9.2026) לשאלה "FIB, אלומת אלקטרונים או לייזר?": "laser"
  ['שיטת החריטה', 'חריטה בלייזר'],
  ['גובה האות', 'בערך 0.035 מ״מ; אותיות הכותרת עד 0.1 מ״מ'],
  ['שטח החריטה', '5 × 5 מ״מ'],
  // "סיליקון מונו־קריסטלי" ישב כאן בלי מקור. המפעל (17.9.2026): "The pattern is etched onto the glass surface"
  ['החומר של השבב', 'זכוכית'],
  // "ספיר סינתטי, קשיות 9 מוס" ישב כאן בלי מקור. המפעל (17.9.2026): "The protective window is glass"
  ['החלון שמגן על השבב', 'זכוכית'],
  ['אטימות', 'סגור לגמרי - עמיד למים, לזיעה ולמוצרי קוסמטיקה בשימוש יומיומי'],
  ['בדיקת איכות', 'כל אות נבדקת מול הטקסט המקורי'],
];

const FAQ: QA[] = [
  {
    q: 'אפשר באמת לקרוא את הטקסט?',
    a: 'לא בעין, וגם לא בזכוכית מגדלת רגילה. הגובה של כל אות הוא 0.035 מ״מ, בערך חצי מעובי של שערה, וקוראים אותה רק במיקרוסקופ. הטקסט נמצא שם כולו, גם אם לא רואים אותו. הזכוכית המגדלת שבאתר היא הדמיה של איך זה נראה בהגדלה.',
  },
  {
    q: 'אפשר להיכנס עם התכשיט לשירותים?',
    a: 'כן. האותיות כל כך קטנות, שאי אפשר לקרוא אותן בעין, רק במיקרוסקופ. לכן אפשר להיכנס עם התכשיט לשירותים. אישור מפורט של רב יתווסף לעמוד הזה.',
  },
  {
    q: 'איך אתם בודקים שהברכה מדויקת?',
    a: 'אחרי החריטה בודקים את השבב מול הטקסט המקורי, אות אחרי אות. שבב עם טעות אחת לא עובר, ולא יוצא מהמעבדה.',
  },
  {
    q: 'מאיפה הטקסט של הברכות?',
    a: 'מהטקסטים המסורתיים, בלי שינויים: פרקי תהילים, קטעים מהתורה, משלי ל״א ותפילת הדרך. מאיפה בדיוק לקוחה כל ברכה - כתוב בעמוד שלה, וגם על הכרטיס שמגיע בקופסה.',
  },
  {
    q: 'השבב יכול להימחק או להישרט?',
    a: 'האותיות לא מודפסות על השבב. הן חרוטות בתוך החומר. גם שריטה בזכוכית שמגנה עליו לא תפגע בטקסט. השבב עצמו אטום, וזיעה ומים לא פוגעים בו. את המתכת והציפוי של התכשיט כן צריך להרחיק ממים וממוצרי קוסמטיקה.',
  },
  {
    q: 'כמה זמן לוקח לקבל את התכשיט?',
    a: `${dispatchLine}, ומגיעה תוך ${deliveryLine} מיום המשלוח.`,
  },
  {
    q: 'מה כוללת האחריות?',
    a: 'שנה מיום הקנייה על פגמים בייצור של התכשיט: שבב שהשתחרר ממקומו, הלחמה שנפתחה או חוליה שנפתחה. הסוגר הוא חלק שזז, והאחריות עליו היא חודשיים. תיקון בתקופת האחריות הוא בחינם. שבר, עיקום או נזק שנגרמו משימוש לא כלולים באחריות, ואותם נתקן במחיר עלות.',
  },
];

const CARE = [
  'להוריד לפני מקלחת, ים ובריכה. לא בגלל השבב, אלא בגלל המתכת.',
  'לנגב בבד מיקרופייבר יבש. לא להשתמש בחומרי ניקוי חזקים לתכשיטים, ולא לנקות במכשיר אולטרסוני, כי הרעידות עלולות לפגוע בשבב.',
  'לשמור בקופסה המקורית, רחוק מתכשיטים אחרים שעלולים לשרוט.',
  'פעם בשנה אפשר לשלוח אלינו לליטוש בחינם. אנחנו מחזירים תוך שבוע.',
];

export default function CraftPage() {
  // הצילום על הגוף הוא נקודת המוצא: מה שרואים לפני שמתקרבים
  const shot = wornFor('toldot');

  return (
    <>
      {/* ---- כותרת ---- */}
      <section className="relative overflow-hidden pt-44 pb-14">
        <div className="shell">
          <h1 className="display t-hero">
            <span className="mask-line load">
              <span>איך מכניסים ברכה</span>
            </span>
            <span className="mask-line load">
              <span className="accent-text" style={{ ['--d' as string]: '130ms' }}>
                לשבב כל כך קטן?
              </span>
            </span>
          </h1>
          <p className="lede reveal mt-9 max-w-2xl" style={{ ['--d' as string]: '300ms' }}>
            בקיצור: לא מכניסים, חורטים. קרן לייזר חורטת כל אות
            בתוך השבב עצמו. זו לא הדפסה ולא ציפוי. האותיות הן
            חלק מהחומר.
          </p>
        </div>
      </section>

      {/* ---- לוח ננו ענק ---- */}
      <section className="pb-10">
        <div className="shell">
          {/* ריבועי כמו השבב, לא רצועה ברוחב מלא - ראו עמוד הברכות */}
          <div className="mx-auto w-full" style={{ maxWidth: 560, aspectRatio: '1' }}>
            <NanoLoupe blessing={BLESSINGS[0].id} height="100%" radius={70} />
          </div>
        </div>
      </section>

      {/* ---- קנה מידה ---- */}
      {/* 42% מהקונים מנסים לשפוט גודל פיזי מהתמונה ו־37% מהאתרים לא
          נותנים שום רמז. בעמוד שכל טענתו היא "קטן מכדי לראות", זו הראיה */}
      <section className="py-24">
        <div className="shell grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <h2 className="display t-1">
              <span className="mask-line">
                <span>כמה זה באמת קטן</span>
              </span>
            </h2>
            <p className="lede reveal mt-6 max-w-md" style={{ ['--d' as string]: '160ms' }}>
              קל להגיד 0.035 מילימטר, קשה לדמיין את זה. כאן מתקרבים צעד אחרי צעד,
              מהתכשיט שעל הצוואר ועד האותיות. כל הברכה נכנסת בחלון האחרון.
            </p>
          </div>

          <div className="reveal" style={{ ['--d' as string]: '260ms' }}>
            <ZoomLadder
              photo={shot?.file ?? '/scene/toldot-wood.jpg'}
              focus={shot ? wornFocus(shot, 'toldot') : '50% 50%'}
              accent={BLESSINGS[0].accent}
            >
              <NanoLoupe blessing={BLESSINGS[0].id} height="100%" radius={40} readPx={15} hint={false} />
            </ZoomLadder>
          </div>
        </div>
      </section>

      {/* ---- צילום אמיתי במיקרוסקופ ---- */}
      {/* ההדמיה שלמעלה מסבירה את קנה המידה; שני הצילומים האלה מראים
          שהכתב באמת שם. הם מיום הצילום של עמית (2.10.2026): מיקרוסקופ
          דיגיטלי מעל השבב, והנוסח על המסך. חיתוך ויישור בלבד - בלי
          עיבוד ובלי הדמיה. בלי מספר הגדלה, כי אין לו מקור */}
      <section className="pb-24">
        <div className="shell grid items-center gap-12 lg:grid-cols-2">
          <figure className="reveal mx-auto w-full" style={{ maxWidth: 520 }}>
            <Image
              src="/craft/microscope-screen.jpg"
              alt="מסך של מיקרוסקופ דיגיטלי שמציג את הכתוב על השבב: הכותרת אשת חיל, המקור משלי ל״א, והפסוקים הראשונים בניקוד"
              width={1120}
              height={1400}
              sizes="(max-width: 1024px) 92vw, 520px"
              className="h-auto w-full"
              style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)' }}
            />
            <figcaption className="pt-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
              על המסך: אשת חיל, משלי ל״א, י׳-ל״א. הכותרת, המקור והפסוקים הראשונים, עם הניקוד.
            </figcaption>
          </figure>

          <div>
            <h2 className="display t-1">
              <span className="mask-line">
                <span>וכך זה נראה במיקרוסקופ</span>
              </span>
            </h2>
            <p className="lede reveal mt-6 max-w-md" style={{ ['--d' as string]: '160ms' }}>
              ההדמיה למעלה מראה כמה זה קטן. כאן צילום אמיתי: שמנו מיקרוסקופ
              דיגיטלי מעל השבב, וזה מה שהופיע על המסך.
            </p>
            <figure className="reveal mt-10" style={{ ['--d' as string]: '260ms' }}>
              <Image
                src="/craft/microscope-setup.jpg"
                alt="מיקרוסקופ דיגיטלי מונח מעל שבב התכשיט על משטח שיש, והשבב מואר מתחתיו"
                width={1400}
                height={895}
                sizes="(max-width: 1024px) 92vw, 560px"
                className="h-auto w-full"
                style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)' }}
              />
              <figcaption className="pt-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
                השבב מתחת למיקרוסקופ.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---- מספרים ---- */}
      <section className="py-24">
        <div className="shell grid gap-10 border-y py-14 sm:grid-cols-3" style={{ borderColor: 'var(--line)' }}>
          {/* מספרים עומדים, לא מונים רצים - ראה Scale בעמוד הבית */}
          {[
            { v: LONGEST_BLESSING_CHARS.toLocaleString('he-IL'), l: 'תווים בברכה הארוכה ביותר' },
            { v: '0.035', l: 'מ״מ - גובה האות' },
            { v: '5', l: 'מ״מ - שטח החריטה' },
          ].map((s, i) => (
            <div key={s.l} className="reveal text-center" style={{ ['--d' as string]: `${i * 90}ms` }}>
              <p className="num display" style={{ fontSize: 'var(--ds-1)', lineHeight: 1, color: 'var(--accent-deep)' }}>
                {s.v}
              </p>
              <p className="mt-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <Process />

      {/* ---- מפרט טכני ---- */}
      <section className="py-24" style={{ background: 'var(--bg-2)', borderBlock: '1px solid var(--line)' }}>
        <div className="shell grid gap-14 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <h2 className="display t-1">
              <span className="mask-line">
                <span>המספרים</span>
              </span>
            </h2>
          </div>
          <div>
            {SPECS.map(([k, v], i) => (
              <div
                key={k}
                className="reveal flex flex-col justify-between gap-1 py-5 sm:flex-row sm:items-baseline"
                style={{ borderTop: '1px solid var(--line)', ['--d' as string]: `${i * 45}ms` }}
              >
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>{k}</span>
                <span className="num" style={{ fontSize: 'var(--fs-base)', textAlign: 'start' }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--line)' }} />
          </div>
        </div>
      </section>

      {/* ---- שאלות נפוצות ---- */}
      <section id="faq" className="py-32" style={{ scrollMarginTop: 120 }}>
        <div className="shell grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <h2 className="display t-1">
              <span className="mask-line">
                <span>מה ששואלים</span>
              </span>
              <span className="mask-line">
                <span>הכי הרבה</span>
              </span>
            </h2>
            <p className="lede reveal mt-6 max-w-xs">
              לא מצאתם תשובה? כתבו לנו - עונים באותו יום.
            </p>
          </div>
          <Accordion items={FAQ} />
        </div>
      </section>

      {/* ---- טיפוח ---- */}
      <section id="care" className="pb-32" style={{ scrollMarginTop: 120 }}>
        <div className="shell">
          <div
            className="reveal p-10 md:p-14"
            style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)' }}
          >
            <h2 className="display t-2">ארבעה כללים לשמירה על התכשיט</h2>
            <ol className="mt-9 grid gap-6 sm:grid-cols-2">
              {CARE.map((c, i) => (
                <li key={c} className="flex gap-4">
                  <span className="display" style={{ color: 'var(--accent-deep)', fontSize: 'var(--fs-md)', lineHeight: 1.7 }}>
                    {['א', 'ב', 'ג', 'ד'][i]}
                  </span>
                  <span style={{ fontSize: 'var(--fs-base)', color: 'var(--ink-2)', lineHeight: 1.8 }}>{c}</span>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/categories/necklaces" className="btn btn-solid">לקטלוג</Link>
              <Link href="/blessings" className="btn">חמש הברכות</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
