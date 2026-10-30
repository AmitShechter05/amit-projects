import { PRODUCTS, getProduct, uniqueDesigns, productInStock, type Audience, type Product } from './catalog';
import { saleOf } from './promo';

/**
 * עוד תכשיט לאותו אדם.
 *
 * עמית (30.10.2026): מי שקונה מתנה לאישה לא מסתכל על תכשיט לעצמו. הוא
 * מגיע "נעול" על מי שהוא קונה לה, ולכן ההצעה היא עוד תכשיט בשבילה -
 * ולא תכשיט לגבר שלידה. מכאן שני כללים:
 *   1. אותו קהל כמו מה שכבר נבחר (לאישה / לגבר). דגם לשניהם מתאים לכולם.
 *   2. קודם סוג אחר ממה שנבחר: למי שבחר שרשרת - צמיד, וכך משלימים סט.
 *
 * משמש את העגלה (עד הסף של "משלוח ואריזה עלינו") ואת עמוד ההצטרפות
 * לחבילה (/join).
 */
export function companionsFor(slugs: string[], max = 3): Product[] {
  const chosen = slugs.map((s) => getProduct(s)).filter((p): p is Product => Boolean(p));
  if (!chosen.length) return [];

  const audiences = new Set<Audience>(chosen.map((p) => p.audience).filter((a) => a !== 'unisex'));
  // שני הקהלים בעגלה, או רק דגמים לשניהם - אין ניחוש, מציעים מכולם
  const target = audiences.size === 1 ? [...audiences][0] : null;
  const names = new Set(chosen.map((p) => p.name));
  const categories = new Set(chosen.map((p) => p.category));

  return uniqueDesigns(
    PRODUCTS.filter(
      (p) =>
        !names.has(p.name) &&
        p.category !== 'pins' &&
        productInStock(p) &&
        (!target || p.audience === target || p.audience === 'unisex'),
    ),
  )
    .sort((a, b) => {
      const other = Number(categories.has(a.category)) - Number(categories.has(b.category));
      return other || saleOf(a.price).now - saleOf(b.price).now;
    })
    .slice(0, max);
}

/** "בשבילה" / "בשבילו" / "" לפי מה שנבחר */
export function forWhom(slugs: string[]) {
  const set = new Set(slugs.map((s) => getProduct(s)?.audience).filter((a) => a && a !== 'unisex'));
  if (set.size !== 1) return '';
  return set.has('women') ? 'בשבילה' : 'בשבילו';
}
