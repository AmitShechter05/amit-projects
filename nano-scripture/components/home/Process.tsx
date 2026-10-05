/**
 * ארבעת השלבים.
 *
 * קודם: מספור 01/02/03/04 באותיות מרווחות, וקו התקדמות שמתמלא בזהב
 * עם הגלילה דרך framer-motion. שניהם תבנית - וקו שמתמלא בגלילה היה
 * גם התלות היחידה של האתר בספריית אנימציה שלמה.
 *
 * עכשיו: אותיות עבריות, כמו בכל רשימה אחרת באתר, וקו דק אחד.
 */
const LETTERS = ['א', 'ב', 'ג', 'ד'];

const STEPS = [
  {
    // "פרוסת סיליקון מלוטשת עד לחספוס של פחות מננומטר, מצופה זהב" - סיפור
    // בלי מקור. המפעל: הכתב נחרט על פני הזכוכית, השבבים זהים, בלי סימון
    title: 'השבב',
    body: 'ריבוע זכוכית של 5 על 5 מ״מ. עליו חורטים את הברכה. כל השבבים באותו גודל.',
  },
  {
    title: 'החריטה',
    // "קרן יונים... בחדר נקי בוואקום מלא" - ללא מקור. המפעל: לייזר. חדר נקי - לא אושר
    body: 'קרן לייזר חורטת את הברכה, אות אחרי אות. הגובה של כל אות הוא בערך 0.035 מ״מ.',
  },
  {
    title: 'הבדיקה',
    body: 'בודקים את מה שנחרט מול הטקסט המקורי, אות אחרי אות. שבב עם טעות, אפילו באות אחת, לא עובר.',
  },
  {
    title: 'ההרכבה',
    // "מספר סידורי ותעודה" ישב כאן, ודף האמת אומר שאין תעודה. ירד
    body: 'צורף מכניס את השבב לתכשיט, מתחת לחלון זכוכית, סוגר אותו כך שיהיה אטום, ומלטש את המתכת ביד.',
  },
];

export default function Process() {
  return (
    <section className="py-9 md:py-28">
      <div className="shell grid gap-16 lg:grid-cols-[.85fr_1.15fr] lg:gap-24">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="display t-1">
            <span className="mask-line">
              <span>איך מכינים</span>
            </span>
            <span className="mask-line">
              <span className="accent-text" style={{ ['--d' as string]: '110ms' }}>
                את התכשיט
              </span>
            </span>
          </h2>
          <p className="lede reveal mt-7 max-w-sm" style={{ ['--d' as string]: '180ms' }}>
            ארבעה שלבים, ובכל אחד מהם יש עבודת יד. את השבב מכינים במעבדה,
            ואת התכשיט אצל הצורף.
          </p>
        </div>

        <ol className="flex flex-col">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="reveal grid grid-cols-[2.4rem_1fr] gap-x-4 py-8 md:py-10"
              style={{ ['--d' as string]: `${i * 60}ms`, borderTop: '1px solid var(--line)' }}
            >
              <span
                aria-hidden
                className="display"
                style={{ fontSize: 'var(--ds-3)', lineHeight: 1.2, color: 'var(--accent-deep)' }}
              >
                {LETTERS[i]}
              </span>
              <div>
                <h3 className="display t-2">{s.title}</h3>
                <p className="lede mt-4 max-w-xl" style={{ fontSize: 'var(--fs-md)' }}>
                  {s.body}
                </p>
              </div>
            </li>
          ))}
          <li aria-hidden style={{ borderTop: '1px solid var(--line)' }} />
        </ol>
      </div>
    </section>
  );
}
