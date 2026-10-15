'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { getBlessing } from '@/lib/blessings';
import { FINISHES, CATEGORIES, formatPrice, photoFor, isCutout, type Product } from '@/lib/catalog';
import { saleOf } from '@/lib/promo';
import { waHref } from '@/lib/company';
import {
  WHO_OPTIONS,
  MOMENT_OPTIONS,
  KIND_OPTIONS,
  matchBlessing,
  type Answers,
  type Option,
} from '@/lib/match';

/**
 * "איזו ברכה מתאימה?" - שלוש שאלות, מסך לכל שאלה, ואז המלצה.
 *
 * כל ההיגיון יושב ב-lib/match.ts. כאן רק המסכים: לחיצה על תשובה
 * עוברת לשאלה הבאה, "חזרה" מחזירה אחורה ושומרת את מה שנבחר.
 * התשובות נשמרות רק בזיכרון של העמוד - אין כאן שום דבר שנשלח.
 */

type Step = 0 | 1 | 2 | 3;

const QUESTIONS = [
  { key: 'who', title: 'למי המתנה?', options: WHO_OPTIONS },
  { key: 'moment', title: 'לאיזה רגע?', options: MOMENT_OPTIONS },
  { key: 'kind', title: 'מה מתאים יותר?', options: KIND_OPTIONS },
] as const;

const TOTAL = QUESTIONS.length;

export default function BlessingMatch() {
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // במעבר בין מסכים המיקוד עובר לכותרת החדשה - כך קורא מסך שומע את
  // השאלה הבאה, ומקלדת לא נשארת על כפתור שכבר לא קיים
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const choose = (key: keyof Answers, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setStep((s) => Math.min(s + 1, TOTAL) as Step);
  };

  const back = () => setStep((s) => Math.max(s - 1, 0) as Step);
  const restart = () => {
    setAnswers({});
    setStep(0);
  };

  const done = step === TOTAL && answers.who && answers.moment && answers.kind;
  const q = step < TOTAL ? QUESTIONS[step as 0 | 1 | 2] : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Progress step={step} />

      {done ? (
        <Result answers={answers as Answers} headingRef={heading} onBack={back} onRestart={restart} />
      ) : q ? (
        <Question
          key={step}
          index={step}
          headingRef={heading}
          selected={answers[q.key]}
          onChoose={(v) => choose(q.key, v)}
          onBack={step > 0 ? back : undefined}
        />
      ) : null}
    </div>
  );
}

/* ---------- התקדמות ---------- */

function Progress({ step }: { step: Step }) {
  const label = step < TOTAL ? `שאלה ${step + 1} מתוך ${TOTAL}` : 'ההמלצה שלנו';
  return (
    <div className="mb-8">
      <p aria-live="polite" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
        {label}
      </p>
      <div aria-hidden className="mt-3 flex gap-1.5">
        {QUESTIONS.map((_, i) => (
          <span
            key={i}
            className="h-[3px] flex-1"
            style={{
              borderRadius: 2,
              background: i < step || step === TOTAL ? 'var(--accent)' : i === step ? 'var(--line-strong)' : 'var(--line)',
              transition: 'background-color .4s var(--ease)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- שאלה ---------- */

function Question({
  index,
  selected,
  onChoose,
  onBack,
  headingRef,
}: {
  index: number;
  selected?: string;
  onChoose: (value: string) => void;
  onBack?: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const q = QUESTIONS[index];
  const options = q.options as readonly Option<string>[];
  const id = `match-q-${index}`;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // אפשרות אחת בלבד בסדר הטאב (כמו קבוצת רדיו רגילה), והחצים זזים ביניהן
  const current = Math.max(0, options.findIndex((o) => o.value === selected));
  const [focusIdx, setFocusIdx] = useState(current);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const next: Record<string, number> = {
      ArrowDown: 1,
      ArrowLeft: 1, // ב-RTL שמאלה זה קדימה
      ArrowUp: -1,
      ArrowRight: -1,
    };
    let to: number | null = null;
    if (e.key in next) to = (focusIdx + next[e.key] + options.length) % options.length;
    if (e.key === 'Home') to = 0;
    if (e.key === 'End') to = options.length - 1;
    if (to === null) return;
    e.preventDefault();
    setFocusIdx(to);
    buttons.current[to]?.focus();
  };

  return (
    <section className="reveal load" aria-labelledby={id}>
      <h2 id={id} ref={headingRef} tabIndex={-1} className="display t-2" style={{ outlineOffset: 6 }}>
        {q.title}
      </h2>

      <div
        role="radiogroup"
        aria-labelledby={id}
        onKeyDown={onKey}
        className="mt-8 grid gap-3 sm:grid-cols-2"
      >
        {options.map((o, i) => {
          const on = o.value === selected;
          return (
            <button
              key={o.value}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={i === focusIdx ? 0 : -1}
              onFocus={() => setFocusIdx(i)}
              onClick={() => onChoose(o.value)}
              className="group flex min-h-[72px] w-full items-center justify-between gap-4 text-start"
              style={{
                padding: '1.05rem 1.25rem',
                background: on ? 'var(--surface-2)' : 'var(--surface)',
                border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                borderRadius: 'var(--radius-lg)',
                transition: 'border-color .3s var(--ease), background-color .3s var(--ease)',
                cursor: 'pointer',
              }}
            >
              <span className="min-w-0">
                <span className="block" style={{ fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--ink)' }}>
                  {o.label}
                </span>
                {o.hint && (
                  <span className="mt-1 block" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
                    {o.hint}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className="flex-shrink-0 transition-colors group-hover:text-[var(--accent)]"
                style={{ color: on ? 'var(--accent)' : 'var(--ink-3)', fontSize: 'var(--fs-lg)' }}
              >
                ←
              </span>
            </button>
          );
        })}
      </div>

      {onBack && (
        <button type="button" onClick={onBack} className="btn btn-ghost mt-8" style={{ fontSize: 'var(--fs-sm)' }}>
          → חזרה לשאלה הקודמת
        </button>
      )}
    </section>
  );
}

/* ---------- תוצאה ---------- */

function Result({
  answers,
  onBack,
  onRestart,
  headingRef,
}: {
  answers: Answers;
  onBack: () => void;
  onRestart: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  // מחושב בזמן רינדור ולא מראש: המלאי והמחירים מווקומרס מוחלים על
  // הקטלוג בזמן הרינדור (LivePrices), ומה שחושב לפני כן היה ישן
  const { blessing: id, reason, products, relaxed } = matchBlessing(answers);
  const b = getBlessing(id);
  const wa = waHref
    ? `${waHref}?text=${encodeURIComponent('היי, אשמח לעזרה בבחירת ברכה למתנה')}`
    : null;

  return (
    <section className="reveal load" aria-labelledby="match-result">
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>הברכה שמתאימה:</p>
      <h2
        id="match-result"
        ref={headingRef}
        tabIndex={-1}
        className="display t-1 mt-2"
        style={{ color: b.accentInk, outlineOffset: 6 }}
      >
        {b.title}
      </h2>
      <p className="mt-2" style={{ fontSize: 'var(--fs-md)', color: 'var(--ink-2)', fontWeight: 500 }}>
        {b.forWhom}
      </p>

      <div
        className="mt-7 py-5 ps-5"
        style={{ borderInlineStart: `3px solid ${b.accent}` }}
      >
        <p className="display" style={{ fontSize: 'var(--ds-3)', lineHeight: 1.6, fontWeight: 500 }}>
          {b.opening}
        </p>
        <p className="mt-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
          {b.openingSource}
        </p>
      </div>

      <p className="lede mt-6 max-w-2xl">{reason}</p>

      <p className="mt-4">
        <Link href={`/blessings/${b.id}`} className="link-u" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
          לקרוא את הברכה המלאה ←
        </Link>
      </p>

      {products.length > 0 && (
        <div className="mt-14">
          <h3 className="display" style={{ fontSize: 'var(--fs-xl)' }}>
            תכשיטים עם הברכה הזו
          </h3>
          {relaxed && (
            <p className="mt-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
              לא מצאנו מספיק דגמים בדיוק לפי מה שבחרתם, אז הוספנו עוד כמה עם אותה ברכה.
            </p>
          )}
          <ul className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-5">
            {products.map((p) => (
              <li key={p.slug}>
                <MatchProduct product={p} blessing={b.id} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 pt-6"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <button type="button" onClick={onRestart} className="btn">
          להתחיל מחדש
        </button>
        <button type="button" onClick={onBack} className="btn btn-ghost" style={{ fontSize: 'var(--fs-sm)' }}>
          → לשנות את התשובה האחרונה
        </button>
      </div>

      {wa && (
        <p className="mt-6" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
          לא בטוחים?{' '}
          <a href={wa} target="_blank" rel="noopener noreferrer" className="link-u" style={{ color: 'var(--accent)' }}>
            כתבו לנו בוואטסאפ
          </a>
        </p>
      )}
    </section>
  );
}

/**
 * כרטיס קטן לדגם מומלץ. בטלפון שורה (תמונה ליד הטקסט), כדי ששלושה
 * דגמים ייכנסו למסך אחד; ממסך רחב יותר - כרטיס עם תמונה מלמעלה.
 *
 * הקישור כולל `?b=` - עמוד המוצר בוחר בו את הברכה שהומלצה מראש.
 */
function MatchProduct({ product: p, blessing }: { product: Product; blessing: string }) {
  const sale = saleOf(p.price);
  const photo = photoFor(p);
  const cutout = !photo && isCutout(p);

  return (
    <Link href={`/products/${p.slug}?b=${blessing}`} className="card group flex h-full items-stretch sm:flex-col">
      <div
        className="tile relative w-[34%] flex-shrink-0 overflow-hidden sm:w-full"
        style={{ aspectRatio: '1' }}
      >
        <Image
          src={photo?.src ?? p.image}
          alt={p.name}
          fill
          sizes="(max-width: 640px) 34vw, 260px"
          style={{
            objectPosition: photo?.focus,
            filter: cutout ? 'drop-shadow(0 10px 14px rgb(70 55 20 / .16))' : undefined,
          }}
          className={
            cutout
              ? 'object-contain p-[14%] transition-transform duration-[850ms] group-hover:scale-[1.05]'
              : 'object-cover transition-transform duration-[850ms] group-hover:scale-[1.04]'
          }
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3 sm:px-5 sm:py-4">
        <span className="display block" style={{ fontSize: 'var(--fs-md)' }}>
          {p.name}
        </span>
        <span className="mt-1 block" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
          {CATEGORIES[p.category].singular} · {FINISHES[p.finish]}
        </span>
        <span className="mt-2 flex items-baseline gap-2">
          {sale.discounted && (
            <span className="num" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)', textDecoration: 'line-through' }}>
              {formatPrice(sale.was)}
            </span>
          )}
          <span
            className="num display"
            style={{ fontSize: 'var(--fs-md)', color: sale.discounted ? 'var(--sale)' : undefined }}
          >
            {formatPrice(sale.now)}
          </span>
        </span>
        <span className="mt-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
          לתכשיט ←
        </span>
      </div>
    </Link>
  );
}
