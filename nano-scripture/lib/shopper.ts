'use client';

/**
 * מי הגולש, כשהוא סיפר לנו בעצמו (נרשם בפופאפ, או הקליד מייל בקופה).
 * נשמר בדפדפן בלבד, ומשמש את CartSync לעגלה נטושה לפני הקופה.
 */
const KEY = 'mikra_who';

export type Shopper = { email: string; name?: string };

export function rememberShopper(s: Shopper) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.email)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ email: s.email.trim().toLowerCase(), name: s.name?.trim() || undefined }));
  } catch {
    /* לא קריטי */
  }
}

export function knownShopper(): Shopper | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Shopper | null;
    return v && typeof v.email === 'string' ? v : null;
  } catch {
    return null;
  }
}
