'use client';

import { useEffect } from 'react';

/**
 * דף התודה נטען לפעמים בתוך מסגרת התשלום (/checkout/pay): התוסף של
 * Grow מפנה אליו מתוך המסגרת. אז הוא מוציא את עצמו החוצה, כדי שהלקוח
 * לא יראה אתר בתוך אתר.
 */
export default function BreakOut() {
  useEffect(() => {
    try {
      if (window.top && window.top !== window.self) window.top.location.href = window.location.href;
    } catch {
      /* מסגרת מאתר אחר - אין גישה, ונשארים */
    }
  }, []);
  return null;
}
