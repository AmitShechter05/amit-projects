import Link from 'next/link';
import Image from 'next/image';
import { deliveryLine } from '@/lib/policy';
import { getProduct, formatPrice } from '@/lib/catalog';
import { saleOf } from '@/lib/promo';
import { BLESSINGS } from '@/lib/blessings';

/**
 * איך זה עובד, בשלושה צעדים - מיד אחרי ההירו.
 *
 * עמית (6.10.2026): לקוחות לא מבינים את האתר. המוצר לא מוכר - תכשיט
 * עם שבב שעליו ברכה - וההסבר היה מפוזר לאורך כל העמוד. כאן הוא נאמר
 * פעם אחת, בשלושה משפטים, לפני הכרטיסים הראשונים.
 * אותיות א/ב/ג ולא 01/02 - ראו "מה שנפסל" ב-CLAUDE.md.
 *
 * 7.10.2026: לכל צעד תמונה קטנה (עמית: "צילומי מסך דמה ... איך זה נראה
 * מבפנים"). א ו-ב הם מסכים מוקטנים של האתר עצמו, בנויים בקוד מאותם
 * נתונים - תכשיטים, מחירים ושמות ברכות אמיתיים - כך שלא יתיישנו. ג הוא
 * צילום אמיתי של השבב במיקרוסקופ, מאותו יום צילום כמו בעמוד "איך זה עובד".
 */
const STEPS = [
  { title: 'בוחרים תכשיט', body: 'שרשרת או צמיד, לאישה או לגבר, או סיכה לתינוק.' },
  { title: 'בוחרים ברכה', body: 'אחת מחמש. אפשר לקרוא כל אחת במלואה לפני שקונים.' },
  { title: 'אנחנו חורטים ושולחים', body: `הברכה נחרטת על שבב קטן בתוך התכשיט, ומגיעה אליכם תוך ${deliveryLine}.` },
];
const LETTERS = ['א', 'ב', 'ג'];
/** גובה אחיד לשלוש התמונות, כדי שהשורה תהיה ישרה */
const VISUAL_H = 184;

/** מסגרת של מסך טלפון מוקטן. aria-hidden: זו המחשה, לא כפתורים אמיתיים */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="relative mx-auto flex flex-col justify-between overflow-hidden"
      style={{
        width: '100%',
        maxWidth: 300,
        height: VISUAL_H,
        borderRadius: 14,
        border: '1px solid var(--line-strong)',
        background: 'var(--bg)',
        boxShadow: '0 18px 40px -26px rgb(60 45 15 / .45)',
      }}
    >
      {children}
    </div>
  );
}

function CatalogMock() {
  const picks = ['toldot', 'beseter', 'kachotam', 'chishuk']
    .map((s) => getProduct(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  return (
    <Screen>
      <div>
      <div className="flex gap-1.5 px-3 pt-3">
        {['הכול', 'לאישה', 'לגבר'].map((t, i) => (
          <span
            key={t}
            style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 3,
              border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--line)'}`,
              background: i === 0 ? 'var(--accent)' : 'transparent',
              color: i === 0 ? 'var(--on-accent)' : 'var(--ink-2)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 px-3 pt-2.5">
        {picks.map((p) => (
          <div key={p.slug} style={{ border: '1px solid var(--line)', borderRadius: 4, background: 'var(--surface)' }}>
            <div className="tile relative" style={{ aspectRatio: '1', borderRadius: '4px 4px 0 0' }}>
              <Image src={p.image} alt="" fill sizes="70px" className="object-contain p-1.5" />
            </div>
            <div className="px-1 py-1" style={{ lineHeight: 1.3 }}>
              <div className="display truncate" style={{ fontSize: 8.5 }}>{p.name}</div>
              <div className="num" style={{ fontSize: 8, color: 'var(--ink-2)' }}>{formatPrice(saleOf(p.price).now)}</div>
            </div>
          </div>
        ))}
      </div>
      </div>
      <div className="flex items-center justify-between px-3 pb-3 pt-3">
        <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>כל התכשיטים</span>
        <span style={{ fontSize: 9, color: 'var(--accent-deep)' }}>לתכשיט ←</span>
      </div>
    </Screen>
  );
}

function BlessingMock() {
  const chosen = BLESSINGS[0];
  return (
    <Screen>
      <div>
      <div className="px-3 pt-3 display" style={{ fontSize: 10 }}>
        איזו ברכה תהיה על השבב?
      </div>
      <div className="grid grid-cols-2 gap-1.5 px-3 pt-2">
        {BLESSINGS.slice(0, 4).map((b) => {
          const on = b.id === chosen.id;
          return (
            <div
              key={b.id}
              className="flex items-center gap-1.5"
              style={{
                padding: '5px 6px',
                borderRadius: 3,
                border: `1.2px solid ${on ? b.accent : 'var(--line)'}`,
                background: on ? `color-mix(in oklab, ${b.accentSoft} 55%, var(--surface))` : 'var(--surface)',
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  flexShrink: 0,
                  borderRadius: 2,
                  background: `linear-gradient(145deg, ${b.accentSoft}, ${b.accent} 58%, ${b.accentInk})`,
                }}
              />
              <span className="min-w-0">
                <span className="display block truncate" style={{ fontSize: 8.5, color: on ? b.accentInk : 'var(--ink)' }}>
                  {b.plain}
                </span>
                <span className="block truncate" style={{ fontSize: 7, color: 'var(--ink-3)' }}>
                  {b.forWhom}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      </div>
      <div className="px-3 pb-3 pt-3">
        <div
          className="flex items-center justify-center"
          style={{ height: 24, borderRadius: 3, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 9.5 }}
        >
          הוספה לעגלה
        </div>
      </div>
    </Screen>
  );
}

function ChipPhoto() {
  return (
    <figure className="mx-auto w-full" style={{ maxWidth: 300 }}>
      <div
        className="relative overflow-hidden"
        style={{
          height: VISUAL_H,
          borderRadius: 14,
          border: '1px solid var(--line-strong)',
          boxShadow: '0 18px 40px -26px rgb(60 45 15 / .45)',
        }}
      >
        <Image
          src="/craft/microscope-screen.jpg"
          alt="מסך של מיקרוסקופ שמציג את הברכה החרוטה על השבב: אשת חיל, עם ניקוד"
          fill
          sizes="(max-width: 768px) 90vw, 300px"
          className="object-cover"
          style={{ objectPosition: '50% 38%' }}
        />
      </div>
      <figcaption className="mt-2 text-center" style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)' }}>
        צילום אמיתי: השבב במיקרוסקופ
      </figcaption>
    </figure>
  );
}

const VISUALS = [CatalogMock, BlessingMock, ChipPhoto];

export default function HowItWorks() {
  return (
    <section className="pb-10 pt-6 md:py-16" style={{ borderBottom: '1px solid var(--line)' }}>
      <div className="shell">
        <h2 className="display t-3">איך זה עובד</h2>
        <ol className="mt-6 grid gap-9 md:grid-cols-3 md:gap-10">
          {STEPS.map((s, i) => {
            const Visual = VISUALS[i];
            return (
              <li key={s.title} className="flex flex-col gap-4">
                <Visual />
                <div className="grid grid-cols-[2rem_1fr] gap-x-3">
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
                </div>
              </li>
            );
          })}
        </ol>
        <Link
          href="/catalog"
          className="link-u mt-8 inline-block"
          style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent-deep)' }}
        >
          לכל התכשיטים ←
        </Link>
      </div>
    </section>
  );
}
