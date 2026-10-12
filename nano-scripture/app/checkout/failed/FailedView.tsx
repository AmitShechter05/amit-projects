'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { waHref } from '@/lib/company';
import { readOrderDone, type OrderDone } from '@/lib/orderDone';
import { getProduct, formatPrice } from '@/lib/catalog';
import { getBlessing } from '@/lib/blessings';

/**
 * התשלום לא עבר.
 *
 * עמית (12.10.2026): ללקוח צריך להראות שהתשלום לא עבר, למה, וקישור
 * לנסות שוב. התוסף של Grow מפנה לכאן מתוך מסגרת התשלום (השדה "לינק לדף
 * עיסקה שנכשלה"), ולכן העמוד קודם יוצא מהמסגרת.
 *
 * "נסו שוב" פותח שוב את דף התשלום של אותה הזמנה - הכתובת נשמרה בדפדפן
 * רגע לפני המעבר לתשלום (CheckoutForm, PAY_KEY). כך לא נוצרת הזמנה
 * כפולה, והעגלה לא צריכה להתמלא מחדש.
 *
 * הסיבה: אם Grow מעבירים הודעת שגיאה בכתובת, היא מוצגת. אחרת - הסיבות
 * הנפוצות, כי חברת האשראי לא תמיד מוסרת סיבה.
 */
export const PAY_KEY = 'mikra-last-payment';

function readReason(q: URLSearchParams): string | null {
  for (const k of ['reason', 'message', 'err', 'error', 'statusDescription']) {
    const v = q.get(k);
    if (v && v.trim()) return v.trim().slice(0, 160);
  }
  return null;
}

export default function FailedView() {
  const [state, setState] = useState<{
    retry: string | null;
    number: string | null;
    reason: string | null;
    order: OrderDone | null;
  } | null>(null);

  useEffect(() => {
    // נטען בתוך מסגרת התשלום? יוצאים ממנה, ואז ממשיכים בעמוד המלא
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = window.location.href;
        return;
      }
    } catch {
      /* מסגרת מאתר אחר */
    }
    let retry: string | null = null;
    let number: string | null = null;
    try {
      const saved = JSON.parse(sessionStorage.getItem(PAY_KEY) || 'null');
      if (saved?.url) retry = String(saved.url);
      if (saved?.number) number = String(saved.number);
    } catch {
      /* אין אחסון */
    }
    // מה היה בהזמנה: הסיכום שנשמר רגע לפני המעבר לתשלום (lib/orderDone)
    const order = readOrderDone();
    setState({ retry, number: number ?? order?.number ?? null, reason: readReason(new URLSearchParams(window.location.search)), order });
  }, []);

  if (!state) return null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="display t-1">התשלום לא עבר</h1>
      <p className="lede mt-4">
        לא חויבתם.
        {state.number ? (
          <>
            {' '}
            ההזמנה <span className="num">#{state.number}</span> נשמרה, ואפשר לשלם עליה שוב.
          </>
        ) : (
          ' ההזמנה נשמרה, ואפשר לנסות שוב.'
        )}
      </p>

      {/* העגלה (עמית, 12.10.2026): הלקוח רואה מה הוא עומד לקנות לפני שמנסה שוב */}
      {state.order && state.order.lines.length > 0 && (
        <div className="mt-8">
          <p className="display" style={{ fontSize: 'var(--fs-md)' }}>
            ההזמנה שלך
          </p>
          <ul className="mt-3 flex flex-col">
            {state.order.lines.flatMap((l) => {
              const p = getProduct(l.slug);
              if (!p) return [];
              const b = getBlessing(l.blessing);
              return [
                <li key={`${l.slug}::${l.blessing}`} className="flex items-center gap-3 py-3" style={{ borderTop: '1px solid var(--line)' }}>
                  <span className="tile relative shrink-0 overflow-hidden" style={{ width: 56, height: 56, borderRadius: 'var(--radius)' }}>
                    <Image src={p.image} alt="" fill sizes="56px" className="object-contain p-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="display block truncate" style={{ fontSize: 'var(--fs-base)' }}>
                      {p.name}
                      {l.qty > 1 && <span className="num" style={{ color: 'var(--ink-3)' }}> × {l.qty}</span>}
                    </span>
                    <span className="block truncate" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}>
                      {b.plain}
                    </span>
                  </span>
                  <span className="num shrink-0" style={{ fontSize: 'var(--fs-sm)' }}>
                    {formatPrice(p.price * l.qty)}
                  </span>
                </li>,
              ];
            })}
          </ul>
          <div className="flex items-baseline justify-between pt-3" style={{ borderTop: '1px solid var(--line-strong)' }}>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>סה״כ לתשלום</span>
            <span className="num display" style={{ fontSize: 'var(--fs-lg)' }}>
              {formatPrice(state.order.total)}
            </span>
          </div>
        </div>
      )}

      <div
        className="mt-8 p-5"
        style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)' }}
      >
        <p className="display" style={{ fontSize: 'var(--fs-md)' }}>
          למה זה קורה
        </p>
        {state.reason ? (
          <p className="mt-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
            {state.reason}
          </p>
        ) : (
          <ul className="mt-2 flex list-disc flex-col gap-1 ps-5" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
            <li>חברת האשראי סירבה לעסקה - לפעמים בגלל מסגרת או חסימה זמנית.</li>
            <li>מספר הכרטיס, התוקף או 3 הספרות בגב הכרטיס הוקלדו לא נכון.</li>
            <li>התשלום בוטל, או שהדף נסגר לפני שהסתיים.</li>
          </ul>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {state.retry ? (
          <a href={state.retry} className="btn btn-solid">
            לנסות לשלם שוב
          </a>
        ) : (
          <Link href="/checkout" className="btn btn-solid">
            חזרה לתשלום
          </Link>
        )}
        {waHref && (
          <a
            href={`${waHref}?text=${encodeURIComponent(
              state.number
                ? `שלום, התשלום להזמנה #${state.number} לא עבר. אפשר עזרה?`
                : 'שלום, התשלום באתר לא עבר. אפשר עזרה?',
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            לעזרה בוואטסאפ
          </a>
        )}
      </div>
      <p className="mt-4" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
        אפשר לנסות כרטיס אחר, bit או Apple Pay באותו דף תשלום.
      </p>
    </div>
  );
}
