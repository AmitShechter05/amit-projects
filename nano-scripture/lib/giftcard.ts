/**
 * כרטיס מתנה (16.10.2026, עמית: ₪300 / ₪500 / ₪750, במייל מעוצב למקבל).
 *
 * בווקומרס אלה שלושה מוצרים וירטואליים (GIFT300/500/750), בלי משלוח ובלי
 * ברכה. הקונה משלם באותו עמוד תשלום של Grow. כשההזמנה שולמה, התוסף
 * mikra-store יוצר קוד (קופון בסכום קבוע, בתוקף 5 שנים - כמו שהחוק
 * דורש לשוברי מתנה) ושולח אותו למקבל בתאריך שנבחר, ועותק לקונה.
 * יתרה שלא נוצלה נשארת על הקוד להזמנה הבאה.
 */
export const GIFT_AMOUNTS = [300, 500, 750] as const;
export type GiftAmount = (typeof GIFT_AMOUNTS)[number];

export const giftSku = (amount: GiftAmount) => `GIFT${amount}`;
export const isGiftSku = (sku?: string | null) => Boolean(sku && /^GIFT\d+$/.test(sku));

/** שנים שהקוד בתוקף - צו הגנת הצרכן (שוברי מתנה): לפחות 5 */
export const GIFT_VALID_YEARS = 5;
