import type { Metadata } from 'next';
import BlessingMatch from '@/components/BlessingMatch';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema } from '@/lib/schema';
import { syncPrices } from '@/lib/livePrices';

export const metadata: Metadata = {
  title: 'איזו ברכה מתאימה?',
  description:
    'שלוש שאלות קצרות - למי המתנה, לאיזה רגע, ושרשרת או צמיד - ותקבלו ברכה מתאימה ותכשיטים שאפשר להזמין איתה.',
  alternates: { canonical: '/match' },
  openGraph: {
    type: 'website',
    url: '/match',
    title: 'איזו ברכה מתאימה? · מִקְרָא',
    description: 'שלוש שאלות קצרות, וברכה שמתאימה למתנה שלכם.',
    images: [{ url: '/scene/pair-trio.jpg', alt: 'שלושה תליונים של מִקְרָא' }],
  },
};

export default async function MatchPage() {
  // ההמלצה מציגה מחיר ומלאי (ראו CLAUDE.md: עמוד שמרנדר מחיר בשרת)
  await syncPrices();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'מִקְרָא', path: '/' },
          { name: 'איזו ברכה מתאימה?', path: '/match' },
        ])}
      />
      <section className="pb-28 pt-36">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            <h1 className="display t-1">איזו ברכה מתאימה?</h1>
            <p className="lede mt-5 max-w-2xl">
              שלוש שאלות קצרות, ונגיד לכם איזו ברכה הכי מתאימה למתנה - ועל אילו תכשיטים אפשר להזמין
              אותה.
            </p>
          </div>
          <div className="mt-12">
            <BlessingMatch />
          </div>
        </div>
      </section>
    </>
  );
}
