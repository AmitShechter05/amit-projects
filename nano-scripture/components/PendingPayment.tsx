'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * תשלום פתוח, בכל עמוד באתר.
 *
 * עמית (12.10.2026): שילם ב-bit, לחץ באפליקציה "חזרה לדף העסק" - והטלפון
 * לא חזר לעמוד התשלום אלא פתח מחדש את הקישור שממנו נכנס (הדפדפן של
 * וואטסאפ טוען שוב את הקישור מהצ'אט). לקוח שהגיע ממודעה יחזור כך לעמוד
 * המוצר, בלי לראות שהתשלום עבר.
 *
 * לכן עמוד התשלום שומר בדפדפן את ההזמנה (PENDING_KEY), ובכל עמוד אחר
 * הרכיב הזה שואל את ווקומרס מה מצבה:
 *   - שולמה      → עוברים לעמוד התודה
 *   - ממתינה     → פס קטן בתחתית: "להמשיך לתשלום"
 *   - בוטלה/לא נמצאה, או עברה שעה → נמחקת מהדפדפן
 */
export const PENDING_KEY = 'mikra-pending-payment';
const MAX_AGE = 60 * 60 * 1000;

type Pending = { o: string; k: string; number: string; total: number; at: number };

export function savePending(p: Omit<Pending, 'at'>) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ ...p, at: Date.now() }));
  } catch {
    /* אין אחסון */
  }
}

export function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* אין אחסון */
  }
}

function readPending(): Pending | null {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null') as Pending | null;
    if (!p?.o || !p?.k) return null;
    if (Date.now() - (p.at || 0) > MAX_AGE) {
      clearPending();
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export default function PendingPayment() {
  const path = usePathname();
  const [open, setOpen] = useState<Pending | null>(null);

  useEffect(() => {
    // בעמוד התשלום יש בדיקה משלו, ובעמוד התודה אין מה לבדוק
    if (path?.startsWith('/checkout/pay') || path?.startsWith('/checkout/success')) {
      setOpen(null);
      return;
    }
    const p = readPending();
    if (!p) {
      setOpen(null);
      return;
    }
    let alive = true;
    const check = async () => {
      try {
        const r = await fetch(`/api/checkout/status?o=${encodeURIComponent(p.o)}&k=${encodeURIComponent(p.k)}`, {
          cache: 'no-store',
        });
        if (!alive) return;
        if (r.status === 404) {
          clearPending();
          setOpen(null);
          return;
        }
        const d = (await r.json()) as { paid?: boolean; status?: string };
        if (!alive) return;
        if (d.paid) {
          clearPending();
          window.location.replace(`/checkout/success?order=${encodeURIComponent(p.number)}&sum=${Number(p.total).toFixed(2)}`);
          return;
        }
        if (d.status === 'pending' || d.status === 'failed') setOpen(p);
        else {
          clearPending();
          setOpen(null);
        }
      } catch {
        /* בלי רשת - לא מציגים כלום */
      }
    };
    check();
    // התשלום יכול להיגמר באפליקציה אחרת בזמן שהעמוד פתוח
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [path]);

  if (!open) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[115] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-3 text-center"
      style={{
        background: 'var(--ink)',
        color: '#fff',
        fontSize: 'var(--fs-sm)',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
      }}
    >
      <span>
        התשלום על הזמנה <span className="num">#{open.number}</span> עוד לא הושלם.
      </span>
      <a
        href={`/checkout/pay?o=${encodeURIComponent(open.o)}&k=${encodeURIComponent(open.k)}`}
        style={{ color: '#f3d9a4', fontWeight: 700, textDecoration: 'underline' }}
      >
        להמשיך לתשלום
      </a>
      <button
        type="button"
        aria-label="סגירה"
        onClick={() => {
          clearPending();
          setOpen(null);
        }}
        style={{ color: 'rgb(255 255 255 / .7)', padding: '0 .25rem' }}
      >
        ✕
      </button>
    </div>
  );
}
