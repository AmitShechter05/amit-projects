'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { formatPrice, packshotFit } from '@/lib/catalog';
import { POLICY } from '@/lib/policy';
import PaymentMarks from '@/components/PaymentMarks';
import { savePending, clearPending } from '@/components/PendingPayment';

/**
 * חלון התשלום של Grow, מעל העמוד שלנו.
 *
 * ה-SDK (gs.min.js) הוא של Grow, והחלון שהוא פותח הוא שלהם - שם
 * מקלידים כרטיס, בוחרים bit, Apple Pay, Google Pay או PayBox. פרטי
 * הכרטיס לא עוברים דרכנו. כשהתשלום עובר Grow מודיעים לתוסף בווקומרס,
 * והוא מסמן את ההזמנה כשולמה; אנחנו רק מעבירים את הלקוח לעמוד התודה.
 *
 * מאחורי החלון יש סיכום הזמנה אמיתי (עמית, 12.10.2026: "שיציג סיכום
 * הזמנה ... ולא דף מעפן"): מה נקנה, משלוח, הנחה, סה"כ ולאן זה נשלח.
 * אם הלקוח סוגר את החלון, הסיכום נשאר עם כפתור שפותח אותו שוב.
 */
declare global {
  interface Window {
    growPayment?: {
      init: (config: unknown) => void;
      renderPaymentOptions: (token: string) => void;
    };
  }
}

const SDK = 'https://cdn.meshulam.co.il/sdk/gs.min.js';

/** הודעת השגיאה של Grow, אם יש. המבנה לא מתועד, ולכן כמה שמות */
function reasonOf(r: unknown): string {
  if (!r || typeof r !== 'object') return typeof r === 'string' ? r : '';
  const o = r as Record<string, unknown>;
  for (const v of [o.message, o.statusDescription, (o.data as Record<string, unknown>)?.message, (o.err as Record<string, unknown>)?.message]) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

export type PaySummary = {
  lines: { name: string; image: string | null; blessing: string | null; qty: number; amount: number }[];
  fees: { name: string; amount: number }[];
  shipping: { label: string; amount: number } | null;
  discount: number;
  total: number;
  shipTo: { name: string; address: string } | null;
};

const row = { fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' } as const;

export default function GrowSheet({
  token,
  number,
  path,
  summary,
}: {
  token: string;
  number: string;
  /** כתובת עמוד התשלום של ההזמנה (?o=&k=) */
  path: string;
  summary: PaySummary;
}) {
  const total = summary.total;
  const [state, setState] = useState<'loading' | 'open' | 'closed' | 'error'>('loading');
  const ready = useRef(false);

  const open = () => {
    if (!window.growPayment) return;
    setState('open');
    window.growPayment.renderPaymentOptions(token);
  };

  useEffect(() => {
    // "לנסות לשלם שוב" בעמוד הכישלון חוזר לכאן, גם כשלא הגיעו מהקופה
    // (למשל מקישור תשלום ששלחנו). המפתח של FailedView.PAY_KEY
    try {
      sessionStorage.setItem(
        'mikra-last-payment',
        JSON.stringify({ url: path, number }),
      );
    } catch {
      /* אין אחסון */
    }
    // אם הלקוח חוזר מ-bit לעמוד אחר באתר, PendingPayment ימצא את ההזמנה משם
    {
      const q = new URLSearchParams(path.split('?')[1] ?? '');
      savePending({ o: q.get('o') ?? '', k: q.get('k') ?? '', number, total });
    }
    const fail = (reason: string) => {
      // ההזמנה נוסעת לעמוד הכישלון, כדי שיציג אותה גם בלי מה שנשמר בדפדפן
      const q = new URLSearchParams(path.split('?')[1] ?? '');
      if (reason) q.set('reason', reason.slice(0, 160));
      window.location.href = `/checkout/failed?${q}`;
    };
    const start = () => {
      if (ready.current || !window.growPayment) return;
      ready.current = true;
      window.growPayment.init({
        environment: 'PRODUCTION',
        version: '1.0',
        events: {
          onSuccess: () => {
            clearPending();
            window.location.href = `/checkout/success?order=${encodeURIComponent(number)}&sum=${total.toFixed(2)}`;
          },
          onFailure: (r: unknown) => fail(reasonOf(r)),
          onError: (r: unknown) => fail(reasonOf(r)),
          onTimeout: () => fail('עבר יותר מדי זמן והתשלום בוטל. אפשר לנסות שוב.'),
          onWalletChange: (s: unknown) => {
            if (s === 'close') setState('closed');
          },
        },
      });
      // ה-SDK צריך רגע אחרי init לפני שהוא מוכן לפתוח חלון
      setTimeout(open, 600);
    };

    // bit ותשלומים שנפתחים באפליקציה: כשחוזרים לדפדפן, האירוע של Grow לא
    // תמיד מגיע. אז שואלים את ווקומרס בעצמנו - כל כמה שניות, ומיד כשחוזרים
    // ללשונית - ואם ההזמנה שולמה, עוברים לעמוד התודה
    let gone = false;
    const check = async () => {
      if (gone) return;
      try {
        const r = await fetch(`/api/checkout/status?${path.split('?')[1] ?? ''}`, { cache: 'no-store' });
        const d = (await r.json()) as { paid?: boolean };
        if (d.paid && !gone) {
          gone = true;
          clearPending();
            window.location.href = `/checkout/success?order=${encodeURIComponent(number)}&sum=${total.toFixed(2)}`;
        }
      } catch {
        /* ננסה בפעם הבאה */
      }
    };
    const poll = window.setInterval(check, 4000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('pageshow', onVisible);
    const stop = () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };

    if (window.growPayment) {
      start();
      return stop;
    }
    const s = document.createElement('script');
    s.src = SDK;
    s.async = true;
    s.onload = start;
    s.onerror = () => setState('error');
    document.head.appendChild(s);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // טעינה מחדש = אסימון חדש מהתוסף, ולא אסימון שכבר נוצל
  const reopen = () => (state === 'loading' ? undefined : state === 'open' ? open() : window.location.reload());

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="display t-2 text-center">תשלום מאובטח</h1>
      <p className="mt-2 text-center" style={row}>
        הזמנה <span className="num">#{number}</span> נשמרה. נשאר רק לשלם.
      </p>

      <div
        className="mt-8 p-5 md:p-6"
        style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)' }}
      >
        <p className="display" style={{ fontSize: 'var(--fs-md)' }}>
          סיכום ההזמנה
        </p>
        <ul className="mt-3 flex flex-col">
          {summary.lines.map((l, i) => (
            <li key={i} className="flex items-center gap-3 py-3" style={{ borderTop: i ? '1px solid var(--line)' : undefined }}>
              <span className="tile relative shrink-0 overflow-hidden" style={{ width: 60, height: 60, borderRadius: 'var(--radius)' }}>
                {l.image && <Image src={l.image} alt="" fill sizes="60px" className={packshotFit(l.image, 'p-1')} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="display block truncate" style={{ fontSize: 'var(--fs-base)' }}>
                  {l.name}
                  {l.qty > 1 && <span className="num" style={{ color: 'var(--ink-3)' }}> × {l.qty}</span>}
                </span>
                {l.blessing && (
                  <span className="block truncate" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}>
                    {l.blessing}
                  </span>
                )}
              </span>
              <span className="num shrink-0" style={{ fontSize: 'var(--fs-sm)' }}>
                {formatPrice(l.amount)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
          {summary.fees.map((f) => (
            <div key={f.name} className="flex justify-between" style={row}>
              <span>{f.name}</span>
              <span className="num">{formatPrice(f.amount)}</span>
            </div>
          ))}
          {summary.shipping && (
            <div className="flex justify-between" style={row}>
              <span>{summary.shipping.label}</span>
              <span className="num">{summary.shipping.amount > 0 ? formatPrice(summary.shipping.amount) : 'חינם'}</span>
            </div>
          )}
          {summary.discount > 0 && (
            <div className="flex justify-between" style={{ ...row, color: 'var(--accent)' }}>
              <span>הנחה</span>
              <span className="num">−{formatPrice(summary.discount)}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between pt-3" style={{ borderTop: '1px solid var(--line-strong)' }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>סה״כ לתשלום</span>
          <span className="num display" style={{ fontSize: 'var(--fs-lg)' }}>
            {formatPrice(total)}
          </span>
        </div>

        {summary.shipTo && (
          <p className="mt-4" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}>
            נשלח אל: {summary.shipTo.name}
            {summary.shipTo.name && summary.shipTo.address ? ', ' : ''}
            {summary.shipTo.address}
          </p>
        )}
      </div>

      <button type="button" className="btn btn-solid mt-6 w-full" onClick={reopen} disabled={state === 'loading'}>
        {state === 'loading' ? 'פותחים את התשלום…' : `לתשלום · ${formatPrice(total)}`}
      </button>
      <PaymentMarks tone="cards" gap={6} className="mt-5 justify-center" />
      <p className="mt-3 text-center" style={{ fontSize: 'var(--fs-xs)', color: state === 'error' ? 'var(--accent)' : 'var(--ink-3)' }}>
        {state === 'error'
          ? 'חלון התשלום לא נטען. בדקו את החיבור לאינטרנט ונסו שוב.'
          : `עד ${POLICY.maxInstallments} תשלומים · התשלום מאובטח אצל Grow, ופרטי הכרטיס לא נשמרים אצלנו.`}
      </p>
    </div>
  );
}
