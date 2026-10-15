'use client';

import { useEffect } from 'react';
import { useCart, type CartLine } from '@/lib/cart';
import { knownShopper } from '@/lib/shopper';
import { getProduct } from '@/lib/catalog';
import { isBlessingId } from '@/lib/blessings';

/**
 * עגלה נטושה לפני הקופה.
 *
 * 1. גולש מזוהה (lib/shopper.ts): כל שינוי בעגלה נשלח, אחרי שתי שניות של
 *    שקט, ל-/api/cart. התוסף מחכה שעה ושולח מייל רק אם לא נוצרה הזמנה.
 * 2. ?restore=slug:blessing:qty~... (הקישור מהמייל): העגלה מתמלאת בחזרה
 *    ונפתחת.
 */
export default function CartSync() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const restore = url.searchParams.get('restore');
    if (restore) {
      const lines: CartLine[] = restore.split('~').flatMap((part) => {
        const [slug, blessing, qty] = part.split(':');
        const p = getProduct(slug);
        if (!p || !isBlessingId(blessing) || !p.blessings.includes(blessing)) return [];
        return [{ slug, blessing, qty: Math.max(1, Math.min(20, Number(qty) || 1)) }];
      });
      if (lines.length) useCart.setState({ lines, open: true });
      url.searchParams.delete('restore');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = JSON.stringify(useCart.getState().lines);
    const unsub = useCart.subscribe((s) => {
      const now = JSON.stringify(s.lines);
      if (now === last) return;
      last = now;
      const who = knownShopper();
      if (!who) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: who.email, name: who.name, lines: s.lines }),
          keepalive: true,
        }).catch(() => {});
      }, 2000);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);
  return null;
}
