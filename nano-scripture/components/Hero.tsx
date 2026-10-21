import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { BLESSINGS } from '@/lib/blessings';
import { POLICY } from '@/lib/policy';
import { PROMO } from '@/lib/promo';

/**
 * הירו: הזוג עונד את התכשיטים, הכותרת יושבת על הקיר שבצילום, וזום אל
 * השבב שבמדליון שלה.
 *
 * ------------------------------------------------------------------
 * 21.10.2026 - עמית: "אני רוצה תמונה עם דוגמנים... שהדוגמנים יהיו עם
 * התכשיט", במקום סרטון יום הצילום. ואחרי הגרסה הראשונה: "מרגיש כאילו
 * הרקע בנפרד, אני רוצה שהכיתוב יהיה כחלק מהתמונה". לכן הצילום אינו
 * ריבוע בצד שנמס לרקע של האתר, אלא הרקע עצמו: במחשב הצילום הרחב
 * (hero-landscape) שבו הזוג משמאל וקיר בצבע חול מימין, והטקסט על הקיר.
 * בטלפון הצילום האנכי, שהקיר שמעל הראשים הוארך בעיבוד (couple-tall),
 * והכותרת יושבת על הקיר הזה.
 *
 * העיצוב בפיגמה "מקרא - מודעות", עמוד "W · אתר – הירו חדש". הסרטון
 * לא ירד: הוא עבר למקטע משלו מתחת להירו (components/home/ShootDay.tsx).
 *
 * העדשה היא הצילום האמיתי של שבב "אשת חיל" במיקרוסקופ - אותה עדשה
 * שבמודעות. המדליון עליה הוא תולדות, ואפשר להזמין אותו עם אשת חיל.
 *
 * מעל הכותרת אין "אלפי ביקורות" כמו אצל המתחרים - אין לנו כאלה.
 * במקומן עובדות מהמדיניות. "כסף 925" לא נכנס: חלק מהתכשיטים מפלדה.
 *
 * כפתור אחד, לקטלוג (עמית, 6.10.2026: "לבחירת הברכה" הוביל לעמוד
 * שבו קוראים ולא קונים, והלקוח לא הבין מאיפה מתחילים).
 * ------------------------------------------------------------------
 */

/** ארבע הברכות שאפשר להזמין. ברכת התינוק שייכת לסיכה המוסתרת */
const FOUR = BLESSINGS.filter((b) => b.id !== 'tinok').map((b) => b.plain);

/** צבע הקיר בצילום הרחב, לשוליים במסכים רחבים במיוחד */
const WALL = '#d6c2aa';

type ShotSpec = {
  src: string;
  w: number;
  h: number;
  sizes: string;
  chip: { x: number; y: number };
  ring: number;
  lens: { x: number; y: number; d: number };
};

/**
 * מיקומים בפיקסלים של קובץ המקור. השבב נמדד בגילוי הכחול בקובץ. מכאן
 * נגזרים העיגול, הקו והעדשה, כך שהם נעים יחד עם התמונה בכל רוחב.
 */
const DESKTOP: ShotSpec = {
  src: '/hero/couple-wide.webp',
  w: 3000,
  h: 1191,
  sizes: '(min-width: 768px) 140vw, 1px',
  chip: { x: 348, y: 797 },
  ring: 62,
  lens: { x: 1010, y: 930, d: 330 },
};
const MOBILE: ShotSpec = {
  src: '/hero/couple-tall-v2.webp',
  w: 1350,
  h: 2200,
  sizes: '(max-width: 767px) 100vw, 1px',
  chip: { x: 442, y: 1832 },
  ring: 90,
  lens: { x: 1038, y: 1989, d: 416 },
};

/** הקובץ של העדשה כולל צל; העיגול עצמו הוא 0.877 מרוחבו */
const LENS_CIRCLE = 0.877;

function Shot({ shot, className, style, children }: { shot: ShotSpec; className: string; style?: CSSProperties; children?: ReactNode }) {
  const { w, h, chip, lens, ring } = shot;
  const dx = lens.x - chip.x;
  const dy = lens.y - chip.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const a = { x: chip.x + ux * (ring / 2 + 4), y: chip.y + uy * (ring / 2 + 4) };
  const b = { x: lens.x - ux * (lens.d / 2), y: lens.y - uy * (lens.d / 2) };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const box = lens.d / LENS_CIRCLE;

  return (
    <div className={className} style={{ aspectRatio: `${w} / ${h}`, ...style }}>
      <Image
        src={shot.src}
        alt="דוגמנית ודוגמן עונדים תכשיטים של מקרא: מדליון עץ החיים עם השבב הכחול, מגן דוד וצמיד"
        fill
        priority
        sizes={shot.sizes}
        className="object-cover"
      />
      <svg aria-hidden viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute inset-0 h-full w-full">
        <circle cx={chip.x} cy={chip.y} r={ring / 2 + 12} fill="rgb(222 180 94 / .28)" />
        <circle cx={chip.x} cy={chip.y} r={ring / 2} fill="none" stroke="#c9a14a" strokeWidth={6} />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e2c27a" strokeWidth={5} strokeDasharray="16 12" />
      </svg>
      <div
        className="pointer-events-none absolute z-10"
        style={{ width: pct(box, w), left: pct(lens.x - box / 2, w), top: pct(lens.y - box / 2, h) }}
      >
        <Image src="/hero/lens-eshet.webp" alt="" width={520} height={521} className="h-auto w-full" />
        <p
          className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[40%] rounded px-2.5 py-1"
          style={{
            background: 'rgb(22 21 15 / .72)',
            color: '#fff',
            fontSize: 'var(--fs-xs)',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            width: 'max-content',
          }}
        >
          צילום אמיתי במיקרוסקופ
        </p>
      </div>
      {children}
    </div>
  );
}

function Title({ facts }: { facts: string }) {
  return (
    <>
      <p className="reveal load" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', fontWeight: 500 }}>
        {facts}
      </p>
      <h1 className="display mt-3 text-[11.5vw] md:text-[min(6vw,5.5rem)]" style={{ fontWeight: 800, lineHeight: 1 }}>
        <span className="mask-line load">
          <span>ברכה שלמה</span>
        </span>{' '}
        <span className="mask-line load">
          <span style={{ ['--d' as string]: '120ms' }}>בתוך תכשיט</span>
        </span>
      </h1>
      <p
        className="reveal load mx-auto mt-5 inline-block rounded-md px-4 py-2"
        style={{ ['--d' as string]: '240ms', background: '#18223f', color: '#fff', fontSize: 'var(--fs-sm)', fontWeight: 500 }}
      >
        <span className="md:hidden">4 ברכות שלמות מהתנ״ך</span>
        <span className="hidden md:inline">{FOUR.join('  ·  ')}</span>
      </p>
    </>
  );
}

function Action() {
  return (
    <>
      <p className="reveal load mx-auto max-w-[34rem]" style={{ ['--d' as string]: '360ms', color: 'var(--ink-2)', lineHeight: 1.6 }}>
        בוחרים ברכה וקוראים את כולה באתר. היא נחרטת על שבב זכוכית בתוך התכשיט, מילה במילה.
      </p>
      <div className="reveal load mt-7 flex justify-center" style={{ ['--d' as string]: '440ms' }}>
        <Link href="/catalog" className="btn btn-solid" style={{ ['--pad' as string]: '1.05rem 2.6rem', fontSize: 'var(--fs-base)' }}>
          לקטלוג
        </Link>
      </div>
    </>
  );
}

/** בטלפון התג בפינה השמאלית: בימנית יושבת העדשה */
function Badge({ side = 'right' }: { side?: 'right' | 'left' }) {
  return (
    <p
      className={`absolute bottom-0 z-10 px-4 py-2 ${side === 'right' ? 'right-0 rounded-tl-lg' : 'left-0 rounded-tr-lg'}`}
      style={{ background: '#18223f', color: '#fff', fontSize: 'var(--fs-sm)', fontWeight: 700 }}
    >
      {PROMO.percent}% הנחה בהצטרפות למועדון
    </p>
  );
}

export default function Hero() {
  const facts = `שבב של 5 מ״מ  ·  החזרה תוך ${POLICY.returnDays} יום  ·  משלוח לכל הארץ`;

  return (
    <>
      {/* מחשב: הצילום הרחב הוא הרקע, והטקסט על הקיר שמימין לזוג */}
      <section className="relative hidden overflow-hidden md:block" style={{ height: 'min(88vh, 820px)', background: WALL }}>
        <Shot shot={DESKTOP} className="absolute bottom-0 left-0 top-24" />
        <div className="shell relative h-full pt-24">
          <div className="flex h-full w-[46%] flex-col items-center justify-center text-center">
            <Title facts={facts} />
            <div className="mt-6">
              <Action />
            </div>
          </div>
        </div>
        <Badge />
      </section>

      {/* טלפון: הצילום האנכי, והכותרת על הקיר שמעל הראשים */}
      <section className="relative overflow-hidden pt-24 md:hidden">
        <Shot shot={MOBILE} className="relative w-full">
          <div className="absolute inset-x-0 top-[5%] mx-auto w-[var(--shell)] text-center">
            <Title facts={facts} />
          </div>
          <Badge side="left" />
        </Shot>
        <div className="shell pb-12 pt-6 text-center">
          <Action />
        </div>
      </section>
    </>
  );
}
