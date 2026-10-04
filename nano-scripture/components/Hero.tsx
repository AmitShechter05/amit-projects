import Link from 'next/link';
import { preload } from 'react-dom';
import HeroVideo from '@/components/HeroVideo';
import { BRAND } from '@/lib/brand';
import { BLESSINGS, LONGEST_BLESSING_CHARS } from '@/lib/blessings';

/**
 * המקורות, ולא המדיניות.
 *
 * כאן ישבו קודם משלוח, אחריות והחזרה - בדיוק שלושת הפריטים שרצועת
 * האמון שמתחת להירו כבר אומרת, כלומר חזרה ולא תוספת. הסקיל דורש
 * אלמנט של הוכחה מעל הקיפול, ולמותג בלי לקוחות עדיין אין ביקורות.
 * מה שכן יש הוא סמכות המקור: הנוסחים אינם כתובים כאן, הם מצוטטים.
 */
const SOURCES = BLESSINGS.map((b) => {
  const parts = b.sources.split(' · ');
  // המקור הראשון אינו תמיד ציטוט. בברכת התינוק הוא "ברכה לתינוק",
  // תיאור ולא מקור, וברצועה שכל תפקידה סמכות זה מחליש. נבחר החלק
  // שנושא מספר פרק בגרשיים - כלומר הפניה אמיתית
  return parts.find((x) => /[׳״]/.test(x)) ?? parts[parts.length - 1];
});

/**
 * הירו: סרטון "יום צילום" בצד שמאל, והטקסט מימין על הרקע.
 *
 * ------------------------------------------------------------------
 * 4.10.2026 - עמית ביקש שסרטון יום הצילום (סטודיו, דוגמן ודוגמנית,
 * ארבעה תכשיטים) יהיה ההירו, ב-16:9.
 *
 * כאן ישב קודם צילום רחב מאוד (2.5:1) שבו הזוג עומד בקצה השמאלי
 * והטקסט יושב על קיר ריק. בסרטון הדוגמנים במרכז הפריים, ולכן הוא
 * אינו ממלא את כל הרוחב: צעיף הטקסט היה מכסה אותם. במקום זה הסרטון
 * תופס את 62% השמאליים, נחתך סביב מרכזו, והקצה הימני שלו נמס אל הרקע
 * מתחת לעמודת הטקסט. מרכז הסרטון יושב ב-31% מהרוחב - נקי לגמרי.
 *
 * לפני הצילום ישב כאן סרטון אחר, דחיפה אל תוך השבב, והוא הוחלף כי
 * מעבר לשנייה השלישית לא היה לו חומר. הסרטון הנוכחי הוא חומר אחר:
 * אנשים שעונדים את המוצרים, ארבעה שוטים, 15 שניות בלולאה.
 *
 * בטלפון הכותרת יושבת על החלק התחתון של הסרטון, ושאר הטקסט מתחתיו.
 *
 * עד 4.10.2026 הסרטון היה ריבוע והכול ישב מתחתיו - החלטה מתקופת
 * הצילום, שבו טקסט על התמונה כיסה פנים ותכשיטים. עמית ביקש לחבר את
 * הכותרת לסרטון. כדי שהיא לא תכסה את מה שבאים להראות, הסרטון גבוה
 * יותר (4:5 במקום ריבוע): הכותרת וההכהיה תופסות את הרבע התחתון, ומעליהן
 * נשאר שטח נקי בגודל של הריבוע הקודם. רק הכותרת עולה על הסרטון; הפסקה,
 * הכפתורים והמקורות נשארים על הרקע, שם הם נקראים בלי הכהיה.
 * ------------------------------------------------------------------
 */
export default function Hero() {
  // תמונת הפתיחה היא האלמנט הגדול הראשון שנצבע; בלי זה היא מחכה לסרטון
  preload('/hero/shoot-day-poster.jpg', { as: 'image', fetchPriority: 'high' });

  return (
    <section
      // pt-24 בטלפון: הכותרת הקבועה (96px) יושבת מעל התוכן, ובלי הריווח
      // היא מכסה בדיוק את הפנים. במסך רחב הצילום ממלא הכול וזה רצוי
      className="relative grid overflow-hidden pt-24 md:block md:min-h-[var(--hero-h)] md:pt-0"
      style={{ ['--hero-h' as string]: 'min(88vh, 780px)' }}
    >
      {/* בטלפון: 4:5 בזרימה, והכותרת יושבת על החלק התחתון שלו.
          במסך רחב: 62% השמאליים של המקטע */}
      <div className="relative col-start-1 row-start-1 aspect-[4/5] w-full md:absolute md:inset-y-0 md:left-0 md:aspect-auto md:w-[62%]">
        <HeroVideo
          className="absolute inset-0 h-full w-full object-cover"
          label="דוגמן ודוגמנית ביום צילום, עונדים שרשרת מגן דוד, צמיד קלוע, שרשרת אינסוף וצמיד אינסוף - כולם עם השבב הכחול"
        />

        {/* בטלפון: הכהיה מתחת לכותרת שיושבת על הסרטון. בלי זה אותיות
            לבנות על גופייה לבנה אינן נקראות */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[58%] md:hidden"
          style={{
            background:
              'linear-gradient(to top, rgb(12 10 6 / .82) 0%, rgb(12 10 6 / .5) 42%, transparent 100%)',
          }}
        />

        {/* הקצה הימני של הסרטון נמס אל הרקע, רק במסך רחב. האחוזים הם
            מרוחב הסרטון: עמודת הטקסט חופפת ל-13% הימניים שלו */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 -right-0.5 hidden md:block"
          style={{
            background:
              'linear-gradient(to left, var(--bg) 2%, color-mix(in oklab, var(--bg) 70%, transparent) 14%, transparent 32%)',
          }}
        />
      </div>

      {/* בטלפון שתי העטיפות הן display: contents, כך שהכותרת והפסקאות
          הן פריטים של הרשת של המקטע: הכותרת באותו תא של הסרטון, והשאר
          מתחתיו. כך יש כותרת אחת ב-DOM ולא שתיים שאחת מהן מוסתרת */}
      <div className="shell relative max-md:contents md:flex md:min-h-[inherit] md:items-center">
        <div className="max-md:contents md:w-[46%] md:py-24">
          {/* בלי תווית מעל הכותרת. "כסף 925 · צריבת ננו · הנוסח המלא"
              ישבה כאן באותיות מרווחות, והכותרת אומרת את זה טוב יותר */}
          <h1
            className="display z-10 col-start-1 row-start-1 self-end max-md:mx-auto max-md:w-[var(--shell)] max-md:pb-6 max-md:text-white"
            style={{ fontSize: 'var(--ds-hero)', fontWeight: 700, lineHeight: 1.05 }}
          >
            <span className="mask-line load">
              <span>כל הנוסח.</span>
            </span>
            <span className="mask-line load">
              <span style={{ ['--d' as string]: '120ms' }}>לא שורה ממנו.</span>
            </span>
          </h1>

          <p
            className="reveal load mt-5 max-md:mx-auto max-md:mt-6 max-md:w-[var(--shell)]"
            style={{
              ['--d' as string]: '300ms',
              fontSize: 'var(--ds-3)',
              fontWeight: 400,
              color: 'var(--ink-2)',
            }}
          >
            עד <span className="num">{LONGEST_BLESSING_CHARS.toLocaleString('he-IL')}</span> תווים
            נצרבים באותיות של 0.035 מילימטר. חמישה נוסחים - אחד שלכם.
          </p>

          <div
            className="reveal load mt-8 flex flex-wrap items-center gap-4 max-md:mx-auto max-md:w-[var(--shell)]"
            style={{ ['--d' as string]: '440ms' }}
          >
            <Link href="/blessings" className="btn btn-solid" style={{ ['--pad' as string]: '1.05rem 2.6rem', fontSize: 'var(--fs-base)' }}>
              לבחירת הברכה
            </Link>
            <Link href="/categories/necklaces" className="btn">
              לקטלוג
            </Link>
          </div>

          {/* המקורות בשורה אחת עם נקודות, ולא ברשימה עם כוכביות.
              הכוכבית היא סימן היכר של עיצוב מיוצר, ורשימה של חמישה
              פריטים בשתי עמודות תפסה גובה של פסקה כדי לומר משפט אחד */}
          <p
            className="reveal load mt-6 max-md:mx-auto max-md:w-[var(--shell)] max-md:pb-14"
            style={{
              ['--d' as string]: '580ms',
              fontSize: 'var(--fs-xs)',
              color: 'var(--ink-3)',
              lineHeight: 1.9,
              letterSpacing: '.02em',
            }}
          >
            {SOURCES.join(' · ')}
          </p>
        </div>
      </div>
    </section>
  );
}
