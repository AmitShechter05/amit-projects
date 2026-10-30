import { POLICY, type ShippingMethodId } from './policy';
import { dispatchDate } from './delivery';

/**
 * להוסיף לאותה חבילה.
 *
 * עמית (30.10.2026): אפסייל אחרי רכישה. חיוב שני בלחיצה אחת דורש כרטיס
 * שמור אצל Grow (ה-API, ₪500 בחודש), ולכן זו הזמנה נפרדת שמשלמים עליה
 * שוב - אבל היא נוסעת באותה קופסה, ולכן בלי דמי משלוח.
 *
 * החלון אמיתי ולא שעון עצר: שתי ההזמנות חייבות לצאת באותו יום משלוח.
 * הזמנה ששולמה ב-14:00 יוצאת היום ב-18:00, ואפשר להצטרף אליה עד אז.
 * הזמנה מ-21:00 יוצאת מחר, ואפשר להצטרף אליה עד מחר ב-18:00.
 *
 * הזיהוי הוא מפתח ההזמנה של ווקומרס (order_key) ולא המספר: מספרים
 * רצים וניחוש שלהם היה חושף שם וכתובת של לקוח אחר. השרת בודק הכול
 * מחדש (lib/joinServer.ts) - מה שנשמר כאן הוא לתצוגה בלבד.
 *
 * הקובץ רץ בדפדפן ובשרת.
 */
export const JOIN_KEY = 'mikra:join';

export type JoinCtx = {
  /** מזהה ההזמנה בווקומרס */
  id: number;
  key: string;
  /** המספר שהלקוח מכיר */
  number: string;
  /** ISO - מתי נוצרה ההזמנה המקורית. ממנו נגזר יום המשלוח */
  placedAt: string;
  shipping: ShippingMethodId;
};

/** השעון בישראל, כתאריך מקומי. השרת רץ ב-UTC, והחישוב של delivery.ts מקומי */
export function israelWall(d: Date = new Date()) {
  return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** יום המשלוח של הזמנה שנוצרה ברגע הזה (UTC אמיתי) */
export function dispatchOf(createdAt: Date) {
  return dispatchDate(israelWall(createdAt));
}

/** האם הזמנה חדשה עכשיו תצא באותו משלוח כמו הזמנה שנוצרה ב-createdAt */
export function sameDispatch(createdAt: Date, now: Date = new Date()) {
  return dayKey(dispatchOf(createdAt)) === dayKey(dispatchOf(now));
}

/** "היום ב-18:00" / "מחר ב-18:00" / "ביום ראשון ב-18:00" */
export function untilLine(createdAt: Date, now: Date = new Date()) {
  const out = dispatchOf(createdAt);
  const today = israelWall(now);
  const hour = `${POLICY.orderCutoffHour}:00`;
  if (dayKey(out) === dayKey(today)) return `היום עד ${hour}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dayKey(out) === dayKey(tomorrow)) return `מחר עד ${hour}`;
  const day = new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(out);
  return `ב${day} עד ${hour}`;
}

export function saveJoin(ctx: JoinCtx) {
  try {
    sessionStorage.setItem(JOIN_KEY, JSON.stringify(ctx));
  } catch {
    /* אחסון חסום - ההזמנה תצא בנפרד, עם דמי משלוח */
  }
}

/** ההצטרפות הפעילה, או null כשאין או שהחבילה כבר יצאה */
export function readJoin(): JoinCtx | null {
  try {
    const raw = sessionStorage.getItem(JOIN_KEY);
    if (!raw) return null;
    const ctx = JSON.parse(raw) as JoinCtx;
    if (!ctx?.id || !ctx.key) return null;
    if (!sameDispatch(new Date(ctx.placedAt), new Date())) {
      sessionStorage.removeItem(JOIN_KEY);
      return null;
    }
    return ctx;
  } catch {
    return null;
  }
}

export function clearJoin() {
  try {
    sessionStorage.removeItem(JOIN_KEY);
  } catch {
    /* אין מה לנקות */
  }
}
