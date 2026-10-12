'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * דף התשלום של ההזמנה בתוך האתר.
 *
 * עמית (12.10.2026): התשלום בתוך mikra.shop, בלי לעבור לאתר אחר. דף
 * "שלם עבור ההזמנה" של ווקומרס (wp.mikra.shop), שעליו התוסף של Grow
 * מציג כרטיס, ארנק ו-bit, נטען כאן במסגרת. אחרי התשלום התוסף מפנה לדף
 * התודה שלנו - שנטען בתוך המסגרת ומיד יוצא ממנה (BreakOut בעמוד התודה).
 *
 * המסגרת נטענת רק מכתובת של דף תשלום בווקומרס שלנו: הכתובת מגיעה
 * בפרמטר, ובלי הבדיקה כל אחד היה יכול להציג כאן כל אתר שירצה.
 */
const WC = (process.env.NEXT_PUBLIC_WC_URL || '').replace(/\/$/, '');

function safePayUrl(raw: string | null): string | null {
  if (!raw || !WC) return null;
  try {
    const u = new URL(raw);
    const wc = new URL(WC);
    if (u.protocol !== 'https:' || u.host !== wc.host) return null;
    if (!u.pathname.includes('/order-pay/')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export default function PayFrame() {
  const [src, setSrc] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setSrc(safePayUrl(new URLSearchParams(window.location.search).get('u')));
  }, []);

  if (src === undefined) return null;

  if (!src) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="display t-2">לא מצאנו את דף התשלום</h1>
        <p className="lede mt-4">ההזמנה נשמרה. כתבו לנו בוואטסאפ ונשלח קישור לתשלום.</p>
        <Link href="/" className="btn btn-solid mt-8 inline-block">
          לדף הבית
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="display t-2">תשלום מאובטח</h1>
      <p className="mt-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
        התשלום מתבצע אצל Grow. פרטי הכרטיס לא נשמרים אצלנו.
      </p>
      <iframe
        src={src}
        title="תשלום מאובטח"
        allow="payment"
        className="mt-6 w-full"
        style={{
          height: 'min(1100px, 150vh)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          background: '#fff',
        }}
      />
    </div>
  );
}
