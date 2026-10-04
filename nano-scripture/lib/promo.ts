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
  // **פתוח:** בווקומרס הקופון mikra20 פג ב-17.10.2026 ומוגבל לשימוש אחד
  // ללקוח. עמית מאריך אותו לקראת ההשקה והפרסום. עד שזה נעשה, אחרי 17.10
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

/** ההנחה יורדת מסכום הפריטים בלבד, לא מהמשלוח ולא מאריזת המתנה */
export function codeDiscount(itemsSubtotal: number, code: string | null) {
  if (!code || !isPromoCode(code)) return 0;
  return Math.round(itemsSubtotal * (PROMO.percent / 100));
}
