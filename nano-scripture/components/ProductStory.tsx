import Image from 'next/image';
import Link from 'next/link';
import type { Blessing } from '@/lib/blessings';
import { photoFor, sceneFocus, type Product } from '@/lib/catalog';
import { wornFor, wornFocus } from '@/lib/worn';

/**
 * התוכן המסביר בעמוד המוצר: בלוק אחד, צילום ופסקה.
 *
 * עמית (31.10.2026): "תראה איך זה בנוי בתנאור ופשוט תעשה אותו הדבר".
 * אצלם יש בלוק אחד כזה ("כל התנ״ך עליך 24/7"), ואצלנו היו שבעה, והעמוד
 * הגיע ל-12,000 פיקסל בטלפון. מה שנשאר משאר הבלוקים נמצא ב"כל הפרטים"
 * ובשאלות הנפוצות.
 *
 * הצילום: על הגוף אם יש, אחרת הצילום הראשון של הדגם, ובסוף צילום המוצר.
 */
export default function ProductStory({
  product,
  blessing: b,
}: {
  product: Product;
  blessing: Blessing;
}) {
  const worn = wornFor(product.slug);
  const lead = photoFor(product);

  const pool: { src: string; focus: string }[] = [];
  const push = (src?: string | null, focus = '50% 50%') => {
    if (src && !pool.some((p) => p.src === src)) pool.push({ src, focus });
  };
  push(worn?.file, wornFocus(worn, product.slug));
  push(lead?.src, lead?.focus);
  for (const s of product.scenes ?? []) push(s, sceneFocus(s, product.slug));
  // מוצא אחרון: צילום המוצר עצמו. לשני דגמים אין עדיין שום צילום
  // אחר, ובלי זה העמוד שלהם היה טקסט בלבד
  push(product.image);

  const photo = pool[0] ?? null;

  return (
    <section className="pb-8 pt-4">
      <div className="shell">
        <div className="story-row" style={{ borderTop: '1px solid var(--line)' }}>
          <div>
            <h2 className="display" style={{ fontSize: 'var(--ds-3)', lineHeight: 1.35 }}>
              הברכה המלאה, לא רק שורה ממנה
            </h2>
            <p className="mt-4" style={{ fontSize: 'var(--fs-base)', color: 'var(--ink-2)', lineHeight: 1.85 }}>
              {`על השבב שבתוך ${product.name} חרוט הטקסט המלא של ${b.plain}: ${b.words} מילים, ${b.chars.toLocaleString('he-IL')} תווים, עם ניקוד ובלי קיצורים. אפשר לקרוא את כולו כאן באתר לפני שקונים.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              <Link href={`/blessings/${b.id}`} className="link-u" style={{ fontSize: 'var(--fs-sm)', color: b.accentInk }}>
                לקריאת הברכה המלאה ←
              </Link>
              <Link href="/craft" className="link-u" style={{ fontSize: 'var(--fs-sm)', color: b.accentInk }}>
                איך זה עובד ←
              </Link>
            </div>
          </div>

          {photo && (
            <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3', borderRadius: 'var(--radius-lg)' }}>
              <Image
                src={photo.src}
                alt={`${product.name} - הברכה המלאה`}
                fill
                sizes="(max-width: 768px) 92vw, 46vw"
                style={{ objectPosition: photo.focus }}
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
