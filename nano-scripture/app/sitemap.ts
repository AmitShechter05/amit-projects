import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { PRODUCTS, ACTIVE_CATEGORIES } from '@/lib/catalog';
import { BLESSINGS } from '@/lib/blessings';
import { LEGAL } from '@/lib/legal';
import { GUIDES } from '@/lib/guides';

/**
 * נגזר מהנתונים. דגם חדש נכנס למפה בלי שאף אחד יזכור לעדכן.
 *
 * lastModified הוא תאריך קבוע לכל סוג עמוד ולא "עכשיו": מפה שבה כל
 * 30 הכתובות מתעדכנות בכל בקשה אומרת לגוגל שהתאריך חסר משמעות, והוא
 * מתעלם ממנו בכל הקובץ. התאריך מתעדכן ביד כשהתוכן של אותו סוג
 * משתנה - וזה נדיר מספיק כדי שזה יהיה נכון.
 */
// 16.10.2026: נמשכו מהקומיט האחרון שנגע בכל סוג - השכתוב לעברית פשוטה
// (5.10), שם הברכה החדש והמחירים מווקומרס עברו על כל העמודים
const UPDATED = {
  home: '2026-10-15',
  catalog: '2026-10-16',
  blessings: '2026-10-16',
  match: '2026-10-16',
  craft: '2026-10-15',
  legal: '2026-10-12',
};

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string, priority: number, date: string) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(date),
    priority,
  });

  return [
    url('', 1, UPDATED.home),
    url('/blessings', 0.9, UPDATED.blessings),
    url('/match', 0.7, UPDATED.match),
    url('/gift-card', 0.6, UPDATED.match),
    url('/contact', 0.5, UPDATED.match),
    url('/rabbinate', 0.6, '2026-10-27'),
    url('/craft', 0.7, UPDATED.craft),
    url('/guides', 0.6, GUIDES.reduce((m, g) => (g.published > m ? g.published : m), UPDATED.home)),
    url('/catalog', 0.9, UPDATED.catalog),
    ...ACTIVE_CATEGORIES.map((c) => url(`/categories/${c}`, 0.8, UPDATED.catalog)),
    ...PRODUCTS.map((p) => url(`/products/${p.slug}`, 0.9, UPDATED.catalog)),
    ...BLESSINGS.map((b) => url(`/blessings/${b.id}`, 0.7, UPDATED.blessings)),
    ...GUIDES.map((g) => url(`/guides/${g.slug}`, 0.7, g.published)),
    ...LEGAL.map((d) => url(`/legal/${d.slug}`, 0.3, UPDATED.legal)),
  ];
}
