/**
 * הצטרפות למועדון: אימות הפרטים.
 *
 * אותו קובץ רץ בפופאפ ובשרת, מאותה סיבה שבגללה זה נכון בצ'קאאוט -
 * אימות שקיים רק בדפדפן אינו אימות, וה-API הזה יוצר משתמש אמיתי
 * בוורדפרס.
 */
import { normalizePhone } from './checkout';

export type Lead = { name: string; phone: string; email: string; consent: boolean };

export const EMPTY_LEAD: Lead = { name: '', phone: '', email: '', consent: false };

export type LeadErrors = Partial<Record<keyof Lead, string>>;

/**
 * emailOnly - המסלול של טופס הפוטר: כתובת והסכמה, בלי שם ובלי טלפון.
 *
 * הפופאפ (מ-23.11.2026): אימייל חובה, שם פרטי רשות, בלי טלפון. שלושה
 * שדות חובה הבריחו - מתוך כ-300 מבקרים אמיתיים בשבוע נרשם אחד, ובטלפון
 * אף אחד לא משתמש. שם וטלפון נבדקים רק אם מולאו.
 */
export function validateLead(l: Lead, { emailOnly = false } = {}): LeadErrors {
  const e: LeadErrors = {};
  const t = (s: string) => (s || '').trim();

  if (!emailOnly) {
    if (t(l.name) && t(l.name).length < 2) e.name = 'שם פרטי';

    const phone = normalizePhone(l.phone);
    if (t(l.phone) && !/^0(5\d|[2-4,8-9])\d{7}$/.test(phone)) e.phone = 'מספר טלפון ישראלי';
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(t(l.email))) e.email = 'כתובת אימייל תקינה';

  /**
   * ההסכמה לדיוור.
   *
   * סעיף 30א לחוק התקשורת דורש הסכמה מפורשת מראש לפני משלוח דבר
   * פרסומת. הטופס הזה נותן הנחה בתמורה לפרטים, כלומר כל תכליתו היא
   * דיוור - ולכן ההסכמה חייבת להיות פעולה אקטיבית ולא הנחה שנגזרת
   * מהלחיצה. הקנס הוא עד 1,000 שקל להודעה, בלי הוכחת נזק.
   */
  if (!l.consent) e.consent = 'יש לאשר קבלת דיוור';

  return e;
}

export const isValidLead = (l: Lead) => Object.keys(validateLead(l)).length === 0;

/** "ישראל ישראלי" -> ["ישראל", "ישראלי"]. שם יחיד נשאר שם פרטי */
export function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}
