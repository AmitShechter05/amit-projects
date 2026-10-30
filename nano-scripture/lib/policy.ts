import { GIFT_BOX } from './extras';

/**
 * מספרי המדיניות. מקור אמת יחיד.
 *
 * הם היו מפוזרים בשתים־עשרה מחרוזות - בתקנון, ברצועת האמון, בטיקר,
 * בשאלות הנפוצות ובדף המוצר - וכל שינוי חייב לזכור את כולן. אחרי
 * ששיניתי את אחריות הסוגר ואת זמן המשלוח, זה כבר לא ריאלי ביד.
 */
export const POLICY = {
  /** גוף התכשיט: הלחמות, שיבוץ השבב, שיבוץ האבן */
  warrantyMonths: 12,
  /** הסוגר בנפרד. החלק הנע, ולכן תקופה קצרה יותר */
  claspMonths: 2,
  platingGoldMonths: 3,
  platingRhodiumMonths: 6,

  /**
   * שעת הסגירה להזמנות. עמית (17.9.2026): "הזמנה עד 18:00 תצא היום".
   * אחרי השעה הזו - ביום העסקים הבא. ימי המשלוח נספרים מהיציאה, לא
   * מההזמנה.
   */
  orderCutoffHour: 18,
  deliveryMinDays: 2,
  deliveryMaxDays: 4,
  returnDays: 30,

  /** מספר התשלומים המרבי שהסולק יציע */
  maxInstallments: 5,

  /**
   * סף למשלוח חינם. null = אין משלוח חינם.
   *
   * היה כאן 450, וההבטחה הזו הופיעה בשבעה מקומות באתר - ברצועה,
   * ברצועת האמון, בדף המוצר, בעגלה, במפרט ובתקנון. כשהיא בוטלה
   * בווקומרס, כל אחד מהם הפך להבטחה שהחנות לא מקיימת.
   */
  /**
   * הסף נבחר כ"כל שני פריטים": שני הדגמים הזולים ביותר יחד הם ₪698.
   * ההזמנה הטיפוסית היא פריט אחד, והסף הופך את הפריט השני להחלטה
   * שנשאלת. 30.10.2026 (עמית): 550 → 690 אחרי העלאת המחירים, ומעל הסף
   * גם אריזת המתנה חינם (`giftBoxFee`) - "שני תכשיטים = משלוח ואריזה
   * עלינו", בלי עוד אחוזי הנחה.
   *
   * זה מספר עסקי, לא טכני: שינוי כאן מעדכן את העגלה, הצ'קאאוט, סכום
   * הסליקה ושורת המשלוח בהזמנה יחד, ו-null מכבה את המנגנון כולו.
   */
  freeShippingOver: 690 as number | null,

  /** דמי משלוח קבועים. null = טרם נקבע, והעגלה תדחה את המספר לתשלום */
  shippingFlat: 29 as number | null,
};

/**
 * שיטות המשלוח.
 *
 * האיסוף העצמי אינו רק חיסכון של דמי המשלוח - הוא גם ההזדמנות היחידה
 * שבה לקוח מחזיק את התכשיט לפני שהוא משלם עליו במשלוח, ולכן הוא
 * מוצג כאפשרות שווה ולא כהערה קטנה.
 */
export type ShippingMethodId = 'delivery' | 'pickup';

export const SHIPPING: {
  id: ShippingMethodId;
  label: string;
  note: string;
  price: number;
  /** מזהה השיטה בווקומרס */
  wcMethod: string;
}[] = [
  {
    id: 'delivery',
    label: 'משלוח עד הבית',
    note: `מבוטח · ${POLICY.deliveryMinDays}-${POLICY.deliveryMaxDays} ימי עסקים`,
    price: 29,
    wcMethod: 'flat_rate',
  },
  {
    id: 'pickup',
    label: 'איסוף עצמי ממודיעין',
    note: 'בתיאום מראש בוואטסאפ · ללא עלות',
    price: 0,
    wcMethod: 'local_pickup',
  },
];

export const shippingMethod = (id: ShippingMethodId) =>
  SHIPPING.find((m) => m.id === id) ?? SHIPPING[0];

/**
 * דמי המשלוח בפועל, אחרי סף המשלוח החינם.
 *
 * ------------------------------------------------------------------
 * הסף היה מחובר למקום אחד מארבעה, וזה נמדד.
 *
 * פס ההתקדמות בעגלה ("עוד ₪X למשלוח חינם") היה בנוי ועבד. אבל
 * `orderTotal`, הסכום בצ'קאאוט ושורת המשלוח בהזמנה כולם הוסיפו את
 * דמי המשלוח בכל מקרה, ומשתנה בשם `shippingFree` חושב ב-wcOrderCore
 * ולא היה בשימוש בשום מקום.
 *
 * כלומר הדלקת הסף הייתה מבטיחה בעגלה "המשלוח עלינו" וגובה אותו
 * בכל זאת - בדיוק ההבטחה שהחנות לא מקיימת, שממנה ההערה למעלה
 * מזהירה.
 * ------------------------------------------------------------------
 *
 * הסף נמדד על **מחיר המחירון לפני ההנחה**, ולא על מה שמשלמים.
 * זו הייתה כבר התנהגות השרת, והעגלה מדדה אחרת - כך שהשניים היו
 * חלוקים על אותה הזמנה. עכשיו יש חישוב אחד, וכולם קוראים לו.
 */
export function shippingCost(id: ShippingMethodId, itemsListTotal: number, joined = false) {
  const m = shippingMethod(id);
  if (m.price === 0) return 0;
  // הזמנה שמצטרפת לחבילה של הזמנה קודמת (lib/join.ts) נוסעת באותה קופסה
  if (joined) return 0;
  if (POLICY.freeShippingOver !== null && itemsListTotal >= POLICY.freeShippingOver) return 0;
  return m.price;
}

/** האם ההזמנה חצתה את הסף. `null` כשאין סף מוגדר */
export function freeShippingGap(itemsListTotal: number) {
  if (POLICY.freeShippingOver === null) return null;
  return Math.max(0, POLICY.freeShippingOver - itemsListTotal);
}

/**
 * מחיר אריזת המתנה בהזמנה הזו. מעל סף המשלוח החינם היא חינם - אותו סף,
 * אותו מחירון לפני הנחה, כדי שההבטחה "המשלוח והאריזה עלינו" תיגבה
 * בשרת בדיוק כמו שהעגלה מציגה אותה.
 */
export function giftBoxFee(gift: boolean, itemsListTotal: number) {
  if (!gift) return 0;
  return giftBoxFree(itemsListTotal) ? 0 : GIFT_BOX.price;
}

export function giftBoxFree(itemsListTotal: number) {
  return POLICY.freeShippingOver !== null && itemsListTotal >= POLICY.freeShippingOver;
}

/** "1-4 ימי עסקים" - הניסוח היחיד. ה־num עוטף במקומות שצריך LTR */
export const deliveryDays = `${POLICY.deliveryMinDays}-${POLICY.deliveryMaxDays}`;
export const deliveryLine = `${deliveryDays} ימי עסקים`;

/** מתי החבילה יוצאת - המשפט היחיד. "עד 18:00" נגזר מהמדיניות */
export const dispatchLine = `הזמנה עד ${POLICY.orderCutoffHour}:00 יוצאת למשלוח באותו יום`;

/** מה שהעגלה ודף המוצר אומרים על המשלוח, ממקום אחד */
export const shippingNote =
  POLICY.shippingFlat === null
    ? 'מחושב בתשלום'
    : `₪${POLICY.shippingFlat}`;

export const shippingLabel = `משלוח מבוטח · ${deliveryLine}`;

export const warrantyTitle = 'שנה אחריות';
export const warrantyNote = `על גוף התכשיט · ${POLICY.claspMonths} חודשים על הסוגר`;
