import 'server-only';
import { wcGetCached, wcReady, skuToId } from './wc';
import { getProductBySku, PRODUCTS } from './catalog';
import type { RatingMap } from './ratings';

/**
 * ביקורות - מערכת הביקורות של ווקומרס עצמה.
 *
 * ביקורת נכתבת בעמוד /review (קישור אישי מהמייל של אחרי ההזמנה, עם מספר
 * ההזמנה ומפתחה - כך רק מי שקנה יכול לכתוב), ונשמרת בווקומרס כ"ממתינה".
 * עמית מאשר אותה בפאנל (מוצרים ← ביקורות), ורק אז היא מופיעה כאן.
 * לא מסננים ביקורות לפי ציון: כל ביקורת אמיתית שאושרה מוצגת.
 *
 * הביקורות מקובצות לפי שם הדגם, כי בְּסֵתֶר בכסף ובזהב הם אותו תכשיט.
 */

export type Review = { name: string; rating: number; text: string; date: string };
export type ReviewSummary = { avg: number; count: number; items: Review[] };

export const REVIEWS_TAG = 'wc-reviews';

type Row = { product_id: number; reviewer: string; review: string; rating: number; date_created: string; status: string };

const strip = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

export async function getReviews(): Promise<Record<string, ReviewSummary>> {
  if (!wcReady) return {};
  try {
    const [rows, ids] = await Promise.all([
      wcGetCached<Row[]>('/products/reviews', { per_page: 100, status: 'approved' }, 600, [REVIEWS_TAG]),
      skuToId(),
    ]);
    const byId = new Map<number, string>();
    for (const [sku, id] of ids) byId.set(id, sku);
    const out: Record<string, ReviewSummary> = {};
    for (const r of rows) {
      const sku = byId.get(r.product_id);
      const p = sku ? getProductBySku(sku) : undefined;
      if (!p || !(r.rating >= 1 && r.rating <= 5)) continue;
      const s = (out[p.name] ??= { avg: 0, count: 0, items: [] });
      s.items.push({ name: r.reviewer, rating: r.rating, text: strip(r.review), date: r.date_created });
    }
    for (const s of Object.values(out)) {
      s.items.sort((a, b) => b.date.localeCompare(a.date));
      s.count = s.items.length;
      s.avg = Math.round((s.items.reduce((t, x) => t + x.rating, 0) / s.count) * 10) / 10;
    }
    return out;
  } catch (e) {
    console.error('reviews fetch failed', e);
    return {};
  }
}

/** רק הממוצע והמספר - לכרטיסים בצד הלקוח */
export async function getRatings(): Promise<RatingMap> {
  const all = await getReviews();
  const map: RatingMap = {};
  for (const p of PRODUCTS) if (all[p.name]) map[p.name] = { avg: all[p.name].avg, count: all[p.name].count };
  return map;
}
