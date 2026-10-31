import type { Product } from '@/lib/catalog';

/**
 * סרטונים בעמוד המוצר, כמו רצועת הסרטונים בעמוד המוצר של תנאור.
 *
 * עמית (31.10.2026): "לתכשיטי גברים את הסרטונים של הגברים, ואת של הנשים
 * לנשים". הסרטונים של יוצרות תוכן ששילמנו להן, וכתוב את זה מתחת - לא
 * ביקורת ולא לקוחה (כללי האתר: אין המלצות שהומצאו).
 *
 * בסרטונים המקוריים היו צילומי מסך של האתר עם המחירים הישנים (549,
 * 279-299). בגרסה שכאן הם נחתכו, בגבולות משפט, והדיבור לא נפגע. המקור
 * ב-Downloads של עמית, והחיתוך ב-ffmpeg: לורן 0-32 / 38.5-45.8 / 57.25-סוף,
 * ליז לבעלה 0-34.8 / 39.65-סוף. ליז לאמא ולאח - בלי שינוי.
 */
type Clip = { src: string; label: string; product: string };

const CLIPS: Record<'women' | 'men', Clip[]> = {
  women: [
    { src: '/ugc/lauren', label: 'לורן, מתנה לאמא שלה', product: 'ahavat-olam' },
    { src: '/ugc/liz-mom', label: 'ליז, מתנה לאמא שלה', product: 'tipat-or' },
  ],
  men: [
    { src: '/ugc/liz-husband', label: 'ליז, מתנה לבעלה', product: 'luach-libecha' },
    { src: '/ugc/liz-brother', label: 'ליז, מתנה לאח שלה', product: 'luach-libecha' },
  ],
};

export default function ProductVideos({ product }: { product: Product }) {
  if (product.audience === 'unisex') return null;
  // הסרטון שבו רואים את הדגם הזה בדיוק - ראשון
  const clips = [...CLIPS[product.audience]].sort(
    (a, b) => Number(b.product === product.slug) - Number(a.product === product.slug),
  );

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
              />
              <figcaption className="mt-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
                {c.label}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
          סרטונים של יוצרות תוכן שעבדו איתנו.
        </p>
      </div>
    </section>
  );
}
