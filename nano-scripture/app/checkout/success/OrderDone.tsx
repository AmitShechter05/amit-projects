'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useCart, cartTotals } from '@/lib/cart';
import { getProduct, formatPrice } from '@/lib/catalog';
import { getBlessing } from '@/lib/blessings';
import { GIFT_BOX } from '@/lib/extras';
import { shippingMethod, shippingCost, giftBoxFee } from '@/lib/policy';
import Link from 'next/link';
import { sameDispatch, untilLine } from '@/lib/join';
import { forWhom } from '@/lib/companions';
import { trackPurchase } from '@/lib/analytics';
import { readOrderDone, type OrderDone as Done } from '@/lib/orderDone';
import { clearPending } from '@/components/PendingPayment';

/**
 * מה נקנה — הסיכום שמופיע אחרי שההזמנה נסגרה.
 *
 * ------------------------------------------------------------------
 * עד כאן עמוד התודה ידע להגיד מספר הזמנה, וזהו.
 *
 * הקונה סיים לשלם ולא ראה אישור על מה שקנה: לא הדגם, לא הנוסח שבחר,
 * ולא הסכום. בפריט שנעשה בהזמנה והנוסח שלו נצרב לצמיתות, הנוסח הוא
 * בדיוק הפרט שמותר לו לרצות לוודא לפני שהוא סוגר את הלשונית.
 * ------------------------------------------------------------------
 *
 * הרכיב עושה שלושה דברים, ובסדר הזה: מודד את הרכישה, מצייר את
 * הסיכום, ומרוקן את העגלה. הריקון אחרון כי אירוע הרכישה נושא את
 * הפריטים, ועגלה שרוקנה קודם שולחת רכישה בלי תוכן.
 */
export default function OrderDone({ order, sum }: { order?: string; sum?: number }) {
  const clear = useCart((s) => s.clear);
  const [done, setDone] = useState<Done | null>(null);
  const [ready, setReady] = useState(false);
  // React מריץ אפקטים פעמיים בפיתוח, ורכישה אינה דבר שנמדד פעמיים
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    useCart.persist.rehydrate();
    const saved = readOrderDone();
    setDone(saved);
    setReady(true);

    // הפריטים נלקחים מהסיכום השמור, ובנפילה חזרה מהעגלה שטרם רוקנה
    const lines = saved?.lines?.length ? saved.lines : useCart.getState().lines;
    const id = saved?.number ?? order;
    const value = saved?.total ?? sum;

    if (id && lines.length && value != null) {
      trackPurchase(String(id), value, lines);
    }

    clear();
    clearPending();
    // הסיכום נשאר לרענון של אותה לשונית, ונמחק בסגירתה
  }, [clear, order, sum]);

  if (!ready) return null;

  const number = done?.number ?? order;

  /* ---------- אין סיכום: כניסה ישירה, או לשונית חדשה ---------- */
  if (!done) {
    return number ? (
      <div
        className="mt-8 flex flex-wrap items-baseline justify-between gap-2 p-4"
        style={{ borderRadius: 'var(--radius)', border: '1px solid var(--line-strong)', background: 'var(--surface-2)' }}
      >
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>מספר ההזמנה</span>
        <span className="num" style={{ fontSize: 'var(--fs-lg)', fontWeight: 500 }}>
          #{number}
        </span>
      </div>
    ) : null;
  }

  // דגם שהוסר מהקטלוג לא יפיל את עמוד התודה של מי שכבר קנה אותו
  const rows = done.lines.flatMap((l) => {
    const p = getProduct(l.slug);
    return p ? [{ p, l }] : [];
  });

  const totals = cartTotals(done.lines, done.code);
  const ship = shippingMethod(done.shipping);
  const giftFee = giftBoxFee(done.gift, totals.listTotal);
  const shipFee = shippingCost(done.shipping, totals.listTotal, Boolean(done.joinOf));
  // "להוסיף לאותה חבילה" - רק כל עוד החבילה לא יצאה (lib/join.ts)
  const canJoin = Boolean(done.key && done.placedAt && sameDispatch(new Date(done.placedAt)));
  const whom = forWhom(done.lines.map((l) => l.slug));

  return (
    <div className="mt-8">
      {/* ---------- מספר ההזמנה ---------- */}
      <div
        className="flex flex-wrap items-baseline justify-between gap-2 p-4"
        style={{
          borderRadius: 'var(--radius)',
          border: '1px solid var(--line-strong)',
          background: 'var(--surface-2)',
        }}
      >
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>מספר ההזמנה</span>
        <span className="num" style={{ fontSize: 'var(--fs-lg)', fontWeight: 500 }}>
          #{done.number}
        </span>
      </div>

      {/* ההודעה של המסלול הידני. היא מוצגת כאן ולא בעמוד, כי הניסוח
          תלוי במסלול: בסליקה אוטומטית הכסף כבר נגבה, ובידני עוד לא */}
      {done.message && (
        <p
          className="mt-5 p-4"
          style={{
            fontSize: 'var(--fs-sm)',
            lineHeight: 1.8,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--accent)',
            background: 'color-mix(in oklab, var(--accent) 7%, var(--surface))',
            color: 'var(--ink-2)',
          }}
        >
          {done.message}
        </p>
      )}

      {/* ---------- מה נרכש ---------- */}
      <ul className="mt-7 flex flex-col">
        {rows.map(({ p, l }) => {
          const b = getBlessing(l.blessing);
          return (
            <li
              key={`${l.slug}::${l.blessing}`}
              className="flex gap-4 py-5"
              style={{ borderTop: '1px solid var(--line)' }}
            >
              <span
                className="tile relative shrink-0 overflow-hidden"
                style={{ width: 68, height: 68, borderRadius: 'var(--radius)' }}
              >
                <Image src={p.image} alt="" fill sizes="68px" className="object-cover" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="display block" style={{ fontSize: 'var(--fs-md)' }}>
                  {p.name}
                </span>

                {/* הנוסח שנצרב. זה מה שהופך את הפריט לשלו, ולכן הוא
                    מוצג ולא נרמז */}
                <span
                  className="mt-1.5 flex items-center gap-2"
                  style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}
                >
                  <span
                    aria-hidden
                    style={{ width: 8, height: 8, borderRadius: 2, background: b.accent }}
                  />
                  {b.plain}
                </span>

                {l.qty > 1 && (
                  <span className="num mt-1 block" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
                    {formatPrice(p.price)} × {l.qty}
                  </span>
                )}
              </span>

              <span className="num shrink-0" style={{ fontSize: 'var(--fs-md)' }}>
                {formatPrice(p.price * l.qty)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* ---------- הסכום ---------- */}
      <div className="flex flex-col gap-2.5 pt-5" style={{ borderTop: '1px solid var(--line-strong)' }}>
        <Row label="סכום הפריטים" value={formatPrice(totals.listTotal)} />

        {totals.discount > 0 && (
          <Row
            label="הנחה"
            value={`−${formatPrice(totals.discount)}`}
            color="var(--sale)"
          />
        )}

        {done.gift && <Row label={GIFT_BOX.title} value={giftFee ? formatPrice(giftFee) : 'חינם'} />}

        <Row label={ship.label} value={shipFee ? formatPrice(shipFee) : 'חינם'} />

        <div
          className="mt-1.5 flex items-baseline justify-between pt-3.5"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <span className="display" style={{ fontSize: 'var(--fs-md)' }}>סה״כ</span>
          <span className="num display" style={{ fontSize: 'var(--fs-xl)' }}>
            {formatPrice(done.total)}
          </span>
        </div>
      </div>

      {/* ---------- עוד תכשיט לאותה חבילה ---------- */}
      {canJoin && (
        <div
          className="mt-7 p-5"
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--accent)',
            background: 'color-mix(in oklab, var(--accent) 6%, var(--surface))',
          }}
        >
          <p className="display" style={{ fontSize: 'var(--fs-md)' }}>
            עוד תכשיט{whom ? ` ${whom}` : ''}, באותה חבילה?
          </p>
          <p className="mt-1.5" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', lineHeight: 1.7 }}>
            אפשר להוסיף {untilLine(new Date(done.placedAt!))}, כשהחבילה יוצאת. הוא נכנס לאותה קופסה, בלי דמי
            משלוח, והפרטים כבר ממולאים.
          </p>
          <Link
            href={`/join?o=${encodeURIComponent(done.id)}&k=${encodeURIComponent(done.key!)}`}
            className="btn btn-solid mt-4 inline-block"
          >
            לבחירת תכשיט
          </Link>
        </div>
      )}

      {/* ---------- לאן זה נשלח ---------- */}
      {done.toName && (
        <p
          className="mt-6 p-4"
          style={{
            fontSize: 'var(--fs-sm)',
            lineHeight: 1.7,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink-2)',
          }}
        >
          החבילה נשלחת ישירות אל <span style={{ color: 'var(--ink)' }}>{done.toName}</span>, והחשבונית
          נשארת על שמך.
        </p>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>{label}</span>
      <span className="num" style={{ fontSize: 'var(--fs-sm)', color: color ?? 'var(--ink)' }}>
        {value}
      </span>
    </div>
  );
}
