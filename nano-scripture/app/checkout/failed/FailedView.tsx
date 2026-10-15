'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { waHref } from '@/lib/company';
import { readOrderDone, type OrderDone } from '@/lib/orderDone';
import { getProduct, formatPrice, packshotFit } from '@/lib/catalog';
import { getBlessing } from '@/lib/blessings';
import type { PaySummary } from '../pay/GrowSheet';
import { WhatsAppIcon } from '@/components/WhatsAppFab';

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

/**
 * מה עוד לנסות, לפי מה שנכשל. אם Apple Pay הוא שנכשל, אין טעם להציע
 * אותו שוב (עמית, 12.10.2026).
 */
function nextTry(reason: string | null) {
  const r = (reason ?? '').toLowerCase();
  if (r.includes('apple')) return 'אפשר לשלם באותו חלון בכרטיס אשראי או ב-bit.';
  if (r.includes('google')) return 'אפשר לשלם באותו חלון בכרטיס אשראי או ב-bit.';
  if (r.includes('bit') || r.includes('ביט')) return 'אפשר לשלם באותו חלון בכרטיס אשראי.';
  return 'אפשר לנסות כרטיס אחר או bit באותו חלון תשלום.';
}

type FromOrder = { number: string; retry: string; summary: PaySummary } | null;

export default function FailedView({ fromOrder = null }: { fromOrder?: FromOrder }) {
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
    let retry: string | null = fromOrder?.retry ?? null;
    let number: string | null = fromOrder?.number ?? null;
    try {
      const saved = JSON.parse(sessionStorage.getItem(PAY_KEY) || 'null');
      if (!retry && saved?.url) retry = String(saved.url);
      if (!number && saved?.number) number = String(saved.number);
    } catch {
      /* אין אחסון */
    }
    // מה היה בהזמנה: הסיכום שנשמר רגע לפני המעבר לתשלום (lib/orderDone)
    const order = readOrderDone();
    setState({ retry, number: number ?? order?.number ?? null, reason: readReason(new URLSearchParams(window.location.search)), order });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state) return null;
  const summary = fromOrder?.summary ?? null;

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

      {/* העגלה (עמית, 12.10.2026): הלקוח רואה מה הוא עומד לקנות לפני שמנסה שוב.
          קודם מההזמנה בווקומרס, ואם אין - ממה שנשמר בדפדפן */}
      {summary && summary.lines.length > 0 && (
        <div className="mt-8">
          <p className="display" style={{ fontSize: 'var(--fs-md)' }}>
            ההזמנה שלך
          </p>
          <ul className="mt-3 flex flex-col">
            {summary.lines.map((l, i) => (
              <li key={i} className="flex items-center gap-3 py-3" style={{ borderTop: '1px solid var(--line)' }}>
                <span className="tile relative shrink-0 overflow-hidden" style={{ width: 56, height: 56, borderRadius: 'var(--radius)' }}>
                  {l.image && <Image src={l.image} alt="" fill sizes="56px" className={packshotFit(l.image, 'p-1')} />}
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
          <div className="flex items-baseline justify-between pt-3" style={{ borderTop: '1px solid var(--line-strong)' }}>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>סה״כ לתשלום</span>
            <span className="num display" style={{ fontSize: 'var(--fs-lg)' }}>
              {formatPrice(summary.total)}
            </span>
          </div>
        </div>
      )}
      {!summary && state.order && state.order.lines.length > 0 && (
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
                    <Image src={p.image} alt="" fill sizes="56px" className={packshotFit(p.image, 'p-1')} />
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
            className="btn inline-flex items-center gap-2"
          >
            <WhatsAppIcon size={18} />
            לעזרה בוואטסאפ
          </a>
        )}
      </div>
      <p className="mt-4" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
        {nextTry(state.reason)}
      </p>
    </div>
  );
}
