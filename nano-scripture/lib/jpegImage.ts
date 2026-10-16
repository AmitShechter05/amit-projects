import 'server-only';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Product } from './catalog';

/**
 * תמונת המוצר כ-JPEG על רקע לבן, לא ה-WebP השקוף של האתר.
 *
 * שני צרכנים: הפיד, כי מטא מקבל לפיד רק JPEG או PNG; ותצוגת הקישור
 * בשיתוף (og:image), כי וואטסאפ לא מציג WebP בצורה אמינה - ושיתוף
 * בוואטסאפ הוא הערוץ העיקרי בישראל. ה-JPEG נוצר מה-WebP ב-
 * `scripts/feed-images.py` (רקע `#ffffff`). דגם חדש בלי JPEG נופל
 * ל-WebP במקום להישבר - וזו התזכורת להריץ את הסקריפט.
 */
export function jpegImage(p: Product) {
  const jpg = p.image.replace(/\.webp$/, '.jpg');
  return existsSync(join(process.cwd(), 'public', jpg)) ? jpg : p.image;
}
