/**
 * הסכמה לעוגיות.
 *
 * ------------------------------------------------------------------
 * מדידה מהכניסה, עם אפשרות לסרב (עמית, 1.11.2026).
 *
 * עד היום Google Analytics והפיקסל של מטא נטענו רק אחרי "אישור הכל".
 * ביום שהפרסום במטא התחיל התברר המחיר: רוב מי שמגיע ממודעה בטלפון
 * לא לוחץ על הבאנר, ומטא לא ראה מי צפה, מי הוסיף לעגלה ומי הגיע
 * לקופה - והאלגוריתם לומד בעיוורון. עמית בחר: למדוד מהכניסה, באנר
 * שאומר את זה בפירוש, וכפתור "לא מסכים" באותו גודל שמכבה הכול.
 *
 * מי שסירב - לא נמדד, גם לא בביקורים הבאים, עד שהוא משנה את הבחירה
 * ("הגדרות עוגיות" בפוטר).
 * ------------------------------------------------------------------
 */
export type ConsentLevel = 'all' | 'essential';

export type Consent = { level: ConsentLevel; at: string };

export const CONSENT_KEY = 'mikra:consent';

// הבחירה גם בזיכרון: בגלישה פרטית או עם אחסון חסום, "לא מסכים" חייב
// להחזיק לפחות עד סוף הביקור
let chosen: Consent | null = null;

export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  if (chosen) return chosen;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consent;
    return parsed.level === 'all' || parsed.level === 'essential' ? parsed : null;
  } catch {
    // גלישה פרטית, או אחסון חסום - לא נבחר כלום
    return null;
  }
}

export function writeConsent(level: ConsentLevel) {
  const value: Consent = { level, at: new Date().toISOString() };
  chosen = value;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {
    /* בלי אחסון הבחירה נשמרת רק בזיכרון, עד סוף הביקור */
  }
  window.dispatchEvent(new CustomEvent('mikra:consent', { detail: value }));
  return value;
}

/**
 * השער לכל סקריפט מדידה. ברירת המחדל - כן; רק "לא מסכים" מפורש סוגר.
 */
export function hasConsent(kind: 'analytics' | 'marketing') {
  void kind;
  return readConsent()?.level !== 'essential';
}

/** פתיחת הבאנר מחדש, מהקישור בפוטר */
export const CONSENT_OPEN_EVENT = 'mikra:consent-open';
