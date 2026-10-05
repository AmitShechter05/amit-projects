import Image from 'next/image';
import type { Blessing } from '@/lib/blessings';
import { photoFor, sceneFocus, MATERIALS, CHIP_SPEC, type Product } from '@/lib/catalog';
import { wornFor, wornFocus } from '@/lib/worn';

/**
 * התוכן המסביר בעמוד המוצר: פסקה, תמונה, פסקה, תמונה.
 *
 * התוכן הזה היה קיים - אבל ב־/craft, כלומר בעמוד שצריך לנווט אליו.
 * מי שנוחת על דף מוצר מפרסומת לא יגיע לשם. בסריקה של החנות המובילה
 * בקטגוריה יושבים חמישה בלוקים מאוירים כאלה בתוך דף המוצר עצמו,
 * מתחת לקופסת הקנייה ומעל השאלות הנפוצות.
 *
 * שבעת הבלוקים עונים על ההתנגדויות בסדר שבו הן עולות: מה בעצם
 * קניתי, למי זה מתאים, כמה זה קטן, איך אני יודע שזה שם, ממה זה
 * עשוי, איך חיים איתו ומה יגיע אליי. אין כאן טענה שלא נבדקה - כל
 * מספר נגזר מהנוסח עצמו, מהמפרט של הדגם או מהמדיניות.
 *
 * התמונות נפרסות במרווחים ולא במחזוריות: לדגם אחד יש שש ולאחר
 * אחת, ומודולו היה גורם לאותה תמונה להופיע שלוש פעמים באותו עמוד.
 * בלוק שלא נפלה בו תמונה נפרס לרוחב, במידת קריאה ממורכזת.
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

  // בריכת התמונות לבלוקים, בלי כפילות ובלי להסתמך על מה שאין
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

  const spec = (label: string) => product.specs.find((x) => x.label === label)?.value;
  const mat = MATERIALS[product.material];

  const BLOCKS = [
    {
      title: 'הברכה המלאה, לא רק שורה ממנה',
      body: [
        `על השבב שבתוך ${product.name} חרוט הטקסט המלא של ${b.plain}: ${b.words} מילים, ${b.chars.toLocaleString('he-IL')} תווים, בלי קיצורים.`,
        `הוא לקוח מ${b.sources}, ומתחיל במילים "${b.opening}" (${b.openingSource}).`,
        'אפשר לקרוא את כולו כאן באתר לפני שקונים, ולהשוות למקור. זה לא קטע קצר שבחרנו כדי שייכנס. זה הטקסט כולו.',
      ],
    },
    {
      title: b.forWhom,
      body: [
        b.blurb,
        `הברכה הזאת מתאימה במיוחד ל${b.gift.split(' · ').join(', ל')}.`,
        // חמישה מחמישה-עשר הדגמים נושאים נוסח אחד. להם המשפט הזה היה שקר
        ...(product.blessings.length > 1
          ? ['על התכשיט הזה אפשר לבחור גם ברכות אחרות, וכל ברכה מתאימה למישהו אחר. בוחרים כשמזמינים, ואפשר לקרוא את כולן ולהשוות.']
          : []),
      ],
    },
    {
      title: 'כמה זה קטן',
      body: [
        `שטח החריטה הוא ${CHIP_SPEC[0].value}, וכל הברכה נכנסת בו.`,
        'הגובה של כל אות הוא בערך 0.035 מ״מ, בערך חצי מעובי של שערה. האותיות לא מודפסות. הן חרוטות בתוך הזכוכית, ולכן בשימוש רגיל הן לא דוהות ולא משנות צבע.',
      ],
    },
    {
      title: 'איך יודעים שהברכה באמת שם',
      body: [
        'את האותיות אי אפשר לראות בעין, וגם לא בזכוכית מגדלת רגילה. הן כל כך קטנות, שאפשר לקרוא אותן רק במיקרוסקופ.',
        'לכן אנחנו לא מבקשים שתאמינו לנו סתם. כל הברכה מופיעה כאן באתר לפני שקונים, כתוב מאיפה היא לקוחה, וכל שבב נבדק מול הטקסט המקורי, אות אחרי אות, לפני שהוא נכנס לתכשיט.',
        'הזכוכית המגדלת שבעמוד הזה מראה איך השבב נראה בהגדלה.',
      ],
    },
    {
      title: mat.label,
      body: [
        mat.note,
        [
          spec('מתכת') && `המתכת: ${spec('מתכת')}.`,
          spec('סוגר') && `הסוגר: ${spec('סוגר')}.`,
        ]
          .filter(Boolean)
          .join(' '),
        'השבב מוגן בחלון אטום, שעמיד למים, לזיעה ולמוצרי קוסמטיקה. את המתכת והציפוי של התכשיט עצמו כן כדאי להרחיק מהם.',
      ].filter(Boolean),
    },
    {
      title: 'איך עונדים ושומרים',
      body: [
        [spec('אורך השרשרת') && `אורך השרשרת ${spec('אורך השרשרת')}.`, spec('היקף הצמיד') && `היקף הצמיד ${spec('היקף הצמיד')}.`]
          .filter(Boolean)
          .join(' ') || 'עונדים כמו שהוא, אין מה לכוון.',
        'להוריד לפני מקלחת, ים ובריכה. זה לא בגלל השבב אלא בגלל המתכת. מנקים בבד מיקרופייבר יבש, ושומרים בקופסה המקורית, בנפרד מתכשיטים אחרים.',
        'שנה אחריות על פגמים בייצור ובהלחמות, וחודשיים על הסוגר, שהוא החלק שזז. שבר שנגרם משימוש לא כלול באחריות, אבל נשמח לתקן גם אותו, ונודיע מראש כמה זה יעלה.',
      ],
    },
    {
      title: 'הקופסה והכרטיס',
      body: [
        'התכשיט מגיע בקופסה מרופדת ששומרת עליו בדרך. יחד איתו מגיע כרטיס עם שם הברכה, מאיפה היא לקוחה, והברכה המלאה.',
        'שניהם כלולים במחיר בכל הזמנה. אריזת מתנה קשיחה, עטופה בבד ועם סרט, היא בתוספת תשלום. היא מגיעה סגורה ומוכנה לתת במתנה.',
      ],
    },
  ];

  /* תמונה אחת לכל בלוק לכל היותר, פרוסות במרווח שווה על פני הבלוקים */
  const slots = new Map<number, { src: string; focus: string }>();
  const step = BLOCKS.length / Math.max(pool.length, 1);
  pool.forEach((ph, k) => slots.set(Math.min(BLOCKS.length - 1, Math.round(k * step)), ph));

  return (
    <section className="pb-8 pt-4">
      <div className="shell">
        {BLOCKS.map((block, i) => {
          const photo = slots.get(i) ?? null;

          return (
            <div
              key={block.title}
              className="story-row reveal"
              data-flip={photo && i % 2 === 1 ? 'true' : undefined}
              data-wide={photo ? undefined : 'true'}
              style={{
                borderTop: i === 0 || !photo ? undefined : '1px solid var(--line)',
                // בלוק בלי תמונה מקבל משטח משלו. לדגם עם צילום אחד
                // יש חמישה כאלה ברצף, ובלי הבחנה זה קיר טקסט אחד
                background: photo ? undefined : `color-mix(in srgb, ${b.accentSoft} 42%, var(--bg))`,
                borderRadius: photo ? undefined : 'var(--radius-lg)',
                paddingInline: photo ? undefined : '1.5rem',
                marginBlock: photo ? undefined : '.75rem',
              }}
            >
              <div>
                <h2 className="display" style={{ fontSize: 'var(--ds-3)', lineHeight: 1.35 }}>
                  {block.title}
                </h2>
                {block.body.map((line) => (
                  <p
                    key={line}
                    className="mt-4"
                    style={{ fontSize: 'var(--fs-base)', color: 'var(--ink-2)', lineHeight: 1.85 }}
                  >
                    {line}
                  </p>
                ))}
              </div>

              {photo && (
                <div
                  className="relative overflow-hidden"
                  style={{ aspectRatio: '4 / 3', borderRadius: 'var(--radius-lg)' }}
                >
                  <Image
                    src={photo.src}
                    alt={`${product.name} - ${block.title}`}
                    fill
                    sizes="(max-width: 768px) 92vw, 46vw"
                    style={{ objectPosition: photo.focus }}
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
