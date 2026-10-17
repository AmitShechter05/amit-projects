/**
 * ההנחה.
 *
 * עד כאן היא הייתה הורדה רוחבית שמחושבת מראש לתוך כל מחיר באתר. היא
 * הוחלפה בקוד הנחה אמיתי להזמנה הראשונה: המחיר שמוצג הוא המחיר שנגבה,
 * וההנחה ניתנת בעגלה למי שמזין את הקוד.
 *
 * ההבדל אינו סמנטי. מחיר "לפני" שאיש מעולם לא שילם הוא הנחה פיקטיבית,
 * ולפי דיני הגנת הצרכן מחיר שלא היה בתוקף 21 ימים רצופים לפני המכירה
 * מחייב לציין את התקופה שבה כן היה. הנחה אמיתית לא מעוררת את השאלה.
 */

/**
 * הנחה רוחבית שמחושבת לתוך המחירים המוצגים.
 * כבויה - המחירון הוא המחיר שנגבה. הדלקה מחייבת מחיר קודם שנגבה בפועל.
 */
export const AUTO_DISCOUNT = false;

export const PROMO = {
  active: true,
  // 20% → 15% ב-17.9.2026 (עמית), וחזרה ל-20% ב-4.10.2026 למבצעי נובמבר.
  //
  // הקוד עצמו אינו מודפס בשום מקום גלוי באתר (עמית, 4.10.2026): הכותרת
  // והסרגל אומרים "20% על כל האתר", והקוד נמסר רק בהצטרפות למועדון.
  //
  // בווקומרס הקופון mikra20 (id 29) בתוקף עד 30.11.2026 23:59 - הוארך
  // מ-17.10 לבקשת עמית (17.10.2026) - ומוגבל לשימוש אחד ללקוח. אחרי התאריך
  // הקוד יתקבל בעגלה אבל ווקומרס ידחה אותו ביצירת ההזמנה
  percent: 20,
  /** מוזן בעגלה. באנגלית כדי שלא יידרש מעבר שפה בשדה */
  code: 'MIKRA20',
  headline: '20% הנחה על כל האתר',
  sub: 'בהצטרפות למועדון',
  badge: '20%-',
  pill: '20% הנחה',
} as const;

export const promoOn = PROMO.active && PROMO.percent > 0;

/** המחיר שנגבה. בלי הנחה רוחבית הוא זהה למחירון */
export function salePrice(price: number) {
  return AUTO_DISCOUNT && promoOn ? Math.round(price * (1 - PROMO.percent / 100)) : price;
}

export function saleOf(price: number) {
  const now = salePrice(price);
  return { was: price, now, saved: price - now, discounted: now < price };
}

/** רווחים ואותיות קטנות לא אמורים להכשיל לקוח שהעתיק את הקוד */
export function normalizeCode(input: string) {
  return input.replace(/\s+/g, '').toUpperCase();
}

export function isPromoCode(input: string) {
  return promoOn && normalizeCode(input) === PROMO.code;
}

/**
 * קודים אחרים מווקומרס (16.10.2026): קוד אישי מזרימת החזרה, קוד נטישה,
 * כרטיס מתנה. הקופה בודקת אותם מול ווקומרס (app/api/coupon) ורושמת כאן
 * את הסוג והסכום, כדי שהעגלה, הקופה והשרת יחשבו את אותה הנחה.
 * percent - אחוז מהפריטים; fixed_cart - סכום קבוע, עד גובה הפריטים.
 */
export type CouponInfo = { code: string; type: 'percent' | 'fixed_cart'; amount: number };

const COUPONS: Record<string, CouponInfo> = {};

export function registerCoupon(c: CouponInfo) {
  COUPONS[normalizeCode(c.code)] = { ...c, code: normalizeCode(c.code) };
}

export function couponFor(code: string | null): CouponInfo | null {
  if (!code) return null;
  if (isPromoCode(code)) return { code: PROMO.code, type: 'percent', amount: PROMO.percent };
  return COUPONS[normalizeCode(code)] ?? null;
}

/** ההנחה יורדת מסכום הפריטים בלבד, לא מהמשלוח ולא מאריזת המתנה */
export function codeDiscount(itemsSubtotal: number, code: string | null) {
  const c = couponFor(code);
  if (!c) return 0;
  if (c.type === 'fixed_cart') return Math.min(Math.round(c.amount), itemsSubtotal);
  return Math.round(itemsSubtotal * (c.amount / 100));
}
