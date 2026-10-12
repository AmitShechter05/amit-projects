'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/catalog';

/**
 * חלון התשלום של Grow, מעל העמוד שלנו.
 *
 * ה-SDK (gs.min.js) הוא של Grow, והחלון שהוא פותח הוא שלהם - שם
 * מקלידים כרטיס, בוחרים bit, Apple Pay, Google Pay או PayBox. פרטי
 * הכרטיס לא עוברים דרכנו. כשהתשלום עובר Grow מודיעים לתוסף בווקומרס,
 * והוא מסמן את ההזמנה כשולמה; אנחנו רק מעבירים את הלקוח לעמוד התודה.
 *
 * אם הלקוח סוגר את החלון, נשארים כאן עם כפתור שפותח אותו שוב.
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

export default function GrowSheet({ token, number, total }: { token: string; number: string; total: number }) {
  const [state, setState] = useState<'loading' | 'open' | 'closed' | 'error'>('loading');
  const ready = useRef(false);

  const open = () => {
    if (!window.growPayment) return;
    setState('open');
    window.growPayment.renderPaymentOptions(token);
  };

  useEffect(() => {
    const fail = (reason: string) => {
      const q = reason ? `?reason=${encodeURIComponent(reason.slice(0, 160))}` : '';
      window.location.href = `/checkout/failed${q}`;
    };
    const start = () => {
      if (ready.current || !window.growPayment) return;
      ready.current = true;
      window.growPayment.init({
        environment: 'PRODUCTION',
        version: '1.0',
        events: {
          onSuccess: () => {
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

    if (window.growPayment) {
      start();
      return;
    }
    const s = document.createElement('script');
    s.src = SDK;
    s.async = true;
    s.onload = start;
    s.onerror = () => setState('error');
    document.head.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="display t-2">תשלום מאובטח</h1>
      <p className="lede mt-4">
        הזמנה <span className="num">#{number}</span> · <span className="num">{formatPrice(total)}</span>
      </p>
      <p className="mt-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
        {state === 'error'
          ? 'חלון התשלום לא נטען. בדקו את החיבור לאינטרנט ונסו שוב.'
          : state === 'closed'
            ? 'חלון התשלום נסגר. ההזמנה שמורה, ואפשר לפתוח אותו שוב.'
            : 'התשלום מתבצע אצל Grow. פרטי הכרטיס לא נשמרים אצלנו.'}
      </p>
      {(state === 'closed' || state === 'error') && (
        <button
          type="button"
          className="btn btn-solid mt-8"
          // טעינה מחדש = אסימון חדש מהתוסף, ולא אסימון שכבר נוצל
          onClick={() => window.location.reload()}
        >
          לפתוח את התשלום
        </button>
      )}
      {state === 'loading' && (
        <p className="mt-8" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
          פותחים את חלון התשלום…
        </p>
      )}
    </div>
  );
}
