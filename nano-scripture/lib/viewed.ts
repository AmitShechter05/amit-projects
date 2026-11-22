'use client';

import { knownShopper } from './shopper';

/**
 * התכשיטים האחרונים שהגולש ראה - לבלוק "התכשיטים שראית" במיילים (Klaviyo).
 *
 * ------------------------------------------------------------------
 * עמית (23.11.2026): "עגלה דינמית לתכשיטים בהתאם למה שהלקוח ביקר או
 * נטש". העגלה כבר נשלחת (CartSync). כאן - מה שנצפה: שלושת הדגמים
 * האחרונים נשמרים בדפדפן, ונשלחים לשרת רק כשהגולש מוכר לנו (נרשם
 * בפופאפ או הקליד מייל בקופה). גולש אנונימי - כלום לא יוצא מהדפדפן.
 * ------------------------------------------------------------------
 */
const KEY = 'mikra_viewed';
const MAX = 3;

export function viewedSlugs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** שולח את הרשימה לשרת, אם יודעים מי הגולש */
export function syncViewed() {
  const who = knownShopper();
  const slugs = viewedSlugs();
  if (!who || !slugs.length) return;
  fetch('/api/viewed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: who.email, name: who.name, slugs }),
    keepalive: true,
  }).catch(() => {});
}

/** נקרא בעמוד מוצר: הדגם עולה לראש הרשימה */
export function rememberViewed(slug: string) {
  try {
    const next = [slug, ...viewedSlugs().filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return;
  }
  syncViewed();
}
