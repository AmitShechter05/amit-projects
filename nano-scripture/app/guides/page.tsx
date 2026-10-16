import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { allGuides } from '@/lib/guides';
import { syncPrices } from '@/lib/livePrices';
import { breadcrumbSchema } from '@/lib/schema';

const DESCRIPTION =
  'למי מתאימה כל ברכה, איזה דגם לבחור, ומה מגיע בקופסה - מדריכים קצרים למי שמחפש מתנה עם מילים בפנים: לאמא, לחייל, ליולדת, לפתיחת עסק.';

export const metadata: Metadata = {
  title: 'מדריכי מתנה',
  description: DESCRIPTION,
  alternates: { canonical: '/guides' },
  // בלי זה העמוד ירש את og:url של הבית, ושיתוף שלו נראה כמו שיתוף של הבית
  openGraph: {
    type: 'website',
    url: '/guides',
    title: 'מדריכי מתנה · מִקְרָא',
    description: DESCRIPTION,
    images: [{ url: '/hero/share.jpg', width: 1200, height: 630, alt: 'דוגמן ודוגמנית עונדים תכשיטי מִקְרָא עם השבב הכחול' }],
  },
};

export default async function GuidesIndex() {
  await syncPrices();
  const guides = allGuides();

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'מִקְרָא', path: '/' }, { name: 'מדריכים', path: '/guides' }])} />
      <section className="shell pb-28 pt-36">
        <div className="mx-auto max-w-2xl">
          <h1 className="display t-1">מדריכי מתנה</h1>
          <p className="lede mt-5">
            למי מתאימה כל ברכה, איזה תכשיט לבחור, ומה להגיד כשנותנים. קצר ולעניין.
          </p>

          <ul className="mt-12">
            {guides.map((g) => (
              <li key={g.slug} style={{ borderTop: '1px solid var(--line)' }}>
                <Link href={`/guides/${g.slug}`} className="group block py-6">
                  <span className="display block" style={{ fontSize: 'var(--fs-lg)', lineHeight: 1.35 }}>
                    {g.title}
                  </span>
                  <span className="mt-2 block" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', lineHeight: 1.7 }}>
                    {g.lede}
                  </span>
                </Link>
              </li>
            ))}
            <li style={{ borderTop: '1px solid var(--line)' }} />
          </ul>
        </div>
      </section>
    </>
  );
}
