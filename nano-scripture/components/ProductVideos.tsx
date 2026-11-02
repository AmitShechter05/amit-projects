import type { Product } from '@/lib/catalog';

/**
 * סרטונים בעמוד המוצר, כמו רצועת הסרטונים בעמוד המוצר של תנאור.
 *
 * עמית (31.10.2026): "לתכשיטי גברים את הסרטונים של הגברים, ואת של הנשים
 * לנשים". דגם של "שניהם" מקבל את של הנשים (עמית, באותו יום). הסרטונים
 * של יוצרות תוכן; עמית ביקש בלי שורת "יוצרות תוכן" מתחת. מה שאסור הוא
 * להציג אותם כביקורת או כלקוחה - ולכן אין כאן דירוג, ציטוט או "לקוחות".
 *
 * בסרטונים המקוריים היו צילומי מסך של האתר עם המחירים הישנים (549,
 * 279-299). בגרסה שכאן הם נחתכו, בגבולות משפט, והדיבור לא נפגע. המקור
 * ב-Downloads של עמית, והחיתוך ב-ffmpeg: לורן 0-32 / 38.5-45.8 / 57.25-סוף,
 * ליז לבעלה 0-34.8 / 39.65-סוף. ליז לאמא ולאח - בלי שינוי.
 *
 * סרטון הקופסה (עמית, 2.11.2026, IMG_8669): בלי אנשים, רק הקופסה,
 * תליון העין והצמיד הקשיח. לכן הוא מופיע רק בעמודים של שני הדגמים
 * שרואים בו (`only`), ובשאר העמודים נשארים הסרטונים שהיו.
 */
type Clip = { src: string; label: string; product: string; only?: string[] };

const UNBOXING: Clip = {
  src: '/ugc/unboxing',
  label: 'הקופסה, תליון העין והצמיד הקשיח',
  product: '',
  only: ['lo-yanum', 'chishuk'],
};

const CLIPS: Record<'women' | 'men', Clip[]> = {
  women: [
    UNBOXING,
    { src: '/ugc/lauren', label: 'לורן, מתנה לאמא שלה', product: 'ahavat-olam' },
    { src: '/ugc/liz-mom', label: 'ליז, מתנה לאמא שלה', product: 'tipat-or' },
  ],
  men: [
    UNBOXING,
    { src: '/ugc/liz-husband', label: 'ליז, מתנה לבעלה', product: 'luach-libecha' },
    { src: '/ugc/liz-brother', label: 'ליז, מתנה לאח שלה', product: 'luach-libecha' },
  ],
};

export default function ProductVideos({ product }: { product: Product }) {
  const audience = product.audience === 'unisex' ? 'women' : product.audience;
  // הסרטון שבו רואים את הדגם הזה בדיוק - ראשון, ושניים בשורה
  const here = (c: Clip) => c.product === product.slug || Boolean(c.only?.includes(product.slug));
  const clips = CLIPS[audience]
    .filter((c) => !c.only || c.only.includes(product.slug))
    .sort((a, b) => Number(here(b)) - Number(here(a)))
    .slice(0, 2);

  return (
    <section className="pb-14 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="shell pt-12">
        <h2 className="display t-2">ככה נותנים את זה במתנה</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:max-w-[720px]">
          {clips.map((c) => (
            <figure key={c.src}>
              <video
                src={`${c.src}.mp4`}
                poster={`${c.src}.jpg`}
                controls
                playsInline
                preload="none"
                className="w-full"
                style={{ aspectRatio: '9 / 16', objectFit: 'cover', borderRadius: 'var(--radius-lg)', background: 'var(--bg-2)' }}
                aria-label={c.label}
              />
              {/* בלי כיתוב מתחת לסרטון (עמית, 1.11.2026) */}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
