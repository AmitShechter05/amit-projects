/**
 * צילומי הדגמים — תמונות אמיתיות של התכשיטים על אנשים.
 * תמונה אחת יכולה לשרת כמה דגמים (בצילום הזוג נראים שני צמידים),
 * ולכן המפתח הוא הקובץ והדגמים נגזרים ממנו.
 *
 * 4.10.2026: תשעה צילומים בתיקיית shoot באים מיום הצילום של עמית
 * (2.10.2026) - הצילום שלו, עם רקע ואור שנוקו. הגוף, התנוחה והתכשיט
 * כפי שצולמו; צבע השבב הושווה לכחול של שאר האתר. הם לאורך (3:4),
 * ולכן לכל אחד מוקד חיתוך: בריבוע של דף המוצר רבע מהגובה נחתך.
 */
export type WornShot = {
  file: string;
  width: number;
  height: number;
  alt: string;
  /** הדגמים שנראים בפריים — הראשון הוא הנושא של הצילום */
  products: string[];
  /**
   * מוקד החיתוך לכל דגם, כערך object-position.
   *
   * בצילום שנראים בו שני תכשיטים, חיתוך למרכז מפספס את שניהם: ב־lev
   * הצמיד הגברי יושב ברבע השמאלי והנשי בשלושת־רבעים, והמרכז הוא
   * הרווח ביניהם. בלי המוקד, כרטיס ריבועי חותך בדיוק את מה שבאנו
   * להראות. דגם שאינו מופיע כאן נחתך למרכז.
   */
  focus?: Record<string, string>;
};

export const WORN: WornShot[] = [
  {
    file: '/worn/lo-yanum.jpg',
    width: 1254,
    height: 1254,
    alt: 'שרשרת לא ינום בכסף על צוואר אישה בחולצה לבנה, תליון העין והשבב הכחול במרכזו',
    products: ['lo-yanum'],
  },
  {
    file: '/worn/shoot/avot.jpg',
    width: 1400,
    height: 1875,
    alt: 'צמיד עבות בכסף על יד גבר, השבב הכחול בחוליה המרכזית',
    products: ['avot'],
    focus: { avot: '48% 74%' },
  },
  {
    file: '/worn/libi-er.jpg',
    width: 1254,
    height: 1254,
    alt: 'צמיד לב בכסף על יד אישה, השבב הכחול לצד הלב',
    products: ['libi-er'],
  },
  {
    file: '/worn/shoot/libi-er-gold.jpg',
    width: 1400,
    height: 1875,
    alt: 'צמיד לבי ער בזהב על יד אישה, הלב והשבב הכחול במסגרת הזירקוניה',
    products: ['libi-er-gold'],
    focus: { 'libi-er-gold': '51% 74%' },
  },
  {
    file: '/worn/shoot/ahavat-olam.jpg',
    width: 1400,
    height: 1875,
    alt: 'צמיד אהבת עולם בכסף על יד אישה, השבב הכחול במסגרת הזירקוניה וסמל האינסוף בצורת לב',
    products: ['ahavat-olam'],
    focus: { 'ahavat-olam': '51% 100%' },
  },
  {
    file: '/worn/etz-hachaim.jpg',
    width: 1120,
    height: 1400,
    alt: 'שרשרת עץ החיים בכסף 925 ענודה על הצוואר, השבב הכחול משובץ בין הענפים',
    products: ['toldot'],
  },
  {
    file: '/worn/shoot/tipat-or.jpg',
    width: 1400,
    height: 1875,
    alt: 'שרשרת טיפת אור על הצוואר - לולאת אינסוף ותליון השבב הכחול היורד ממנה',
    products: ['tipat-or'],
    focus: { 'tipat-or': '45% 82%' },
  },
  {
    file: '/worn/ein-sof.jpg',
    width: 1400,
    height: 1120,
    alt: 'צמיד אין סוף ושרשרת טיפת אור יחד',
    products: ['ahavat-olam', 'tipat-or'],
    focus: { 'ahavat-olam': '77% 62%', 'tipat-or': '38% 58%' },
  },
  {
    file: '/worn/lev.jpg',
    width: 1400,
    height: 1120,
    alt: 'צמיד עבות על יד גבר וצמיד לב על יד אישה, זה לצד זה',
    products: ['libi-er', 'avot'],
    focus: { 'libi-er': '75% 58%', avot: '28% 57%' },
  },
  {
    file: '/worn/shoot/luach-libecha.jpg',
    width: 1400,
    height: 1875,
    alt: 'תליון לוח לבך בפלדה על חולצה שחורה, השבב הכחול בקצה התחתון',
    products: ['luach-libecha'],
    focus: { 'luach-libecha': '55% 89%' },
  },
  {
    file: '/worn/shoot/avot-black.jpg',
    width: 1400,
    height: 1875,
    alt: 'צמיד עבות בצבע שחור על יד גבר, השבב הכחול בחוליה המרכזית',
    products: ['avot-black'],
    focus: { 'avot-black': '54% 61%' },
  },
  {
    file: '/worn/shoot/beseter.jpg',
    width: 1400,
    height: 1875,
    alt: 'שרשרת בסתר - מגן דוד בפלדה על חולצה שחורה, השבב הכחול במרכזו',
    products: ['beseter'],
    focus: { beseter: '51% 100%' },
  },
  {
    file: '/worn/shoot/beseter-gold.jpg',
    width: 1400,
    height: 1875,
    alt: 'שרשרת בסתר בצבע זהב - מגן דוד על חולצה שחורה, השבב הכחול במרכזו',
    products: ['beseter-gold'],
    focus: { 'beseter-gold': '49% 69%' },
  },
  {
    file: '/worn/shoot/chishuk.jpg',
    width: 1400,
    height: 1875,
    alt: 'צמיד חישוק בפלדה על יד גבר, השבב הכחול בקצה הצמיד',
    products: ['chishuk'],
    focus: { chishuk: '47% 76%' },
  },
];

/** הצילום שבו הדגם הוא הנושא, ואם אין כזה — הצילום הראשון שהוא מופיע בו */
export function wornFor(slug: string) {
  return (
    WORN.find((w) => w.products[0] === slug) ??
    WORN.find((w) => w.products.includes(slug))
  );
}

/** מוקד החיתוך של דגם בצילום נתון. ברירת המחדל היא מרכז הפריים */
export function wornFocus(shot: WornShot | undefined, slug: string) {
  return shot?.focus?.[slug] ?? '50% 50%';
}
