import Link from 'next/link';
import { deliveryLine } from '@/lib/policy';

/**
 * איך זה עובד, בשלושה צעדים - מיד אחרי ההירו.
 *
 * עמית (6.10.2026): לקוחות לא מבינים את האתר. המוצר לא מוכר - תכשיט
 * עם שבב שעליו ברכה - וההסבר היה מפוזר לאורך כל העמוד. כאן הוא נאמר
 * פעם אחת, בשלושה משפטים, לפני הכרטיסים הראשונים.
 * אותיות א/ב/ג ולא 01/02 - ראו "מה שנפסל" ב-CLAUDE.md.
 */
const STEPS = [
  { title: 'בוחרים תכשיט', body: 'שרשרת או צמיד, לאישה או לגבר, או סיכה לתינוק.' },
  { title: 'בוחרים ברכה', body: 'אחת מחמש. אפשר לקרוא כל אחת במלואה לפני שקונים.' },
  { title: 'אנחנו חורטים ושולחים', body: `הברכה נחרטת על שבב קטן בתוך התכשיט, ומגיעה אליכם תוך ${deliveryLine}.` },
];
const LETTERS = ['א', 'ב', 'ג'];

export default function HowItWorks() {
  return (
    <section className="py-10 md:py-16" style={{ borderBottom: '1px solid var(--line)' }}>
      <div className="shell">
        <h2 className="display t-3">איך זה עובד</h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3 md:gap-10">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[2rem_1fr] gap-x-3">
              <span
                aria-hidden
                className="display"
                style={{ fontSize: 'var(--fs-xl)', lineHeight: 1.1, color: 'var(--accent-deep)' }}
              >
                {LETTERS[i]}
              </span>
              <div>
                <h3 className="display" style={{ fontSize: 'var(--fs-lg)', lineHeight: 1.3 }}>
                  {s.title}
                </h3>
                <p className="mt-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', lineHeight: 1.65 }}>
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href="/catalog"
          className="link-u mt-6 inline-block"
          style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent-deep)' }}
        >
          לכל התכשיטים ←
        </Link>
      </div>
    </section>
  );
}
