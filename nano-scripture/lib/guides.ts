import type { BlessingId } from './blessings';
import { PRODUCTS, getProduct, formatPrice } from './catalog';

/**
 * מדריכי המתנה — העמודים שעונים לשאלות שאנשים מקלידים בגוגל.
 *
 * ------------------------------------------------------------------
 * למה זה קיים.
 *
 * אף אחד לא מחפש "תכשיט ננו". מחפשים "מתנה לאמא שיש לה הכול", "מתנה
 * לגיוס", "מה קונים ליולדת". עמודי הקטגוריה והמוצר לא עונים על השאלות
 * האלה, ולכן גוגל לא מביא אליהם את מי ששואל אותן. המדריך הוא העמוד
 * שעונה - ומקשר משם לנוסח ולדגמים.
 * ------------------------------------------------------------------
 *
 * הכללים כאן זהים לשאר האתר: כל טענה נגזרת מהקטלוג, מהמדיניות או
 * מדף האמת. אין ביקורות, אין דחיפות, אין מספרים על גודל האות. הדגמים
 * שמופיעים תחת מקטע חייבים לשאת את הנוסח שהמקטע מדבר עליו - זה נבדק
 * בזמן הבנייה ב-`assertGuides`.
 *
 * הטקסטים עצמם נמצאים ב-guides.data.ts ונוצרו מחוץ לקוד, אחרי בדיקת
 * עובדות; כאן רק הטיפוס והעזרים.
 */
export type GuideSection = {
  h: string;
  p: string[];
  /** דגמים להצגה ככרטיסים מתחת למקטע. חייבים לשאת את `blessing` */
  products: string[];
  /** הנוסח שהמקטע מדבר עליו, לקישור לעמוד הברכה */
  blessing: BlessingId | '';
};

export type Guide = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  lede: string;
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  relatedGuides: string[];
  /** תאריך פרסום, ISO. ל-sitemap ול-Article */
  published: string;
};

export { GUIDES } from './guides.data';
import { GUIDES } from './guides.data';

/**
 * אסימוני המחיר שבטקסט המדריכים.
 *
 *   {₪toldot}                 המחיר של דגם, לפי ה-slug
 *   {₪min:a,b} · {₪max:a,b}   הזול / היקר מבין הדגמים
 *   {₪min:@shmira}            ...מבין כל הדגמים שנושאים את הנוסח
 *
 * עד 4.10.2026 המחירים היו מספרים בתוך הפרוזה, 68 מהם. כשכַּחוֹתָם עלה
 * מ-329 ל-469 צריך היה לתקן שלושה מדריכים ביד, ואת הרביעי היה קל לפספס.
 * אסימון שמצביע על דגם שאינו קיים זורק שגיאה, ולא מדפיס טקסט שבור.
 */
const PRICE_TOKEN = /\{₪(?:(min|max):)?([a-z0-9@,-]+)\}/g;

function tokenPrices(list: string): number[] {
  return list.split(',').flatMap((key) => {
    if (key.startsWith('@')) {
      const hits = PRODUCTS.filter((p) => (p.blessings as string[]).includes(key.slice(1)));
      if (!hits.length) throw new Error(`אסימון מחיר: אין דגם שנושא את הנוסח ${key}`);
      return hits.map((p) => p.price);
    }
    const p = getProduct(key);
    if (!p) throw new Error(`אסימון מחיר: דגם לא מוכר "${key}"`);
    return [p.price];
  });
}

export function fillPrices(text: string): string {
  return text.replace(PRICE_TOKEN, (token, fn: 'min' | 'max' | undefined, list: string) => {
    const prices = tokenPrices(list);
    if (!fn && prices.length !== 1) throw new Error(`אסימון מחיר: ${token} מצביע על יותר מדגם אחד`);
    return formatPrice(fn === 'max' ? Math.max(...prices) : Math.min(...prices));
  });
}

/** המדריך כפי שהוא מוצג: האסימונים מוחלפים במחיר שבקטלוג ברגע הקריאה */
function withPrices(g: Guide): Guide {
  return {
    ...g,
    metaDescription: fillPrices(g.metaDescription),
    lede: fillPrices(g.lede),
    sections: g.sections.map((s) => ({ ...s, h: fillPrices(s.h), p: s.p.map(fillPrices) })),
    faq: g.faq.map((f) => ({ q: fillPrices(f.q), a: fillPrices(f.a) })),
  };
}

/**
 * לתצוגה משתמשים בשתי אלה, ולא ב-GUIDES: שם האסימונים עדיין גולמיים.
 * GUIDES נשאר למה שאינו טקסט - רשימת הכתובות ומפת האתר.
 */
export function getGuide(slug: string) {
  const g = GUIDES.find((x) => x.slug === slug);
  return g ? withPrices(g) : undefined;
}

export function allGuides() {
  return GUIDES.map(withPrices);
}
