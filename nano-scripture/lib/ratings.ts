import type { Product } from './catalog';

/**
 * תקציר הביקורות לכל דגם (לפי שם - כסף וזהב של אותו דגם הם דגם אחד
 * לעניין הביקורות). מגיע מהשרת (lib/reviews.ts) דרך הפריסה ונרשם כאן,
 * כמו המחירים והמלאי, כדי שגם כרטיס מוצר בצד הלקוח יציג כוכבים.
 */
export type RatingMap = Record<string, { avg: number; count: number }>;

const RATINGS: RatingMap = {};

export function applyRatings(map: RatingMap) {
  for (const k of Object.keys(RATINGS)) delete RATINGS[k];
  Object.assign(RATINGS, map);
}

export function ratingFor(p: Pick<Product, 'name'>) {
  return RATINGS[p.name] ?? null;
}
