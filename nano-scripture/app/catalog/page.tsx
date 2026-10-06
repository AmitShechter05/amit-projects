import type { Metadata } from 'next';
import Link from 'next/link';
import CatalogGrid from '@/components/CatalogGrid';
import JsonLd from '@/components/JsonLd';
import { PRODUCTS, uniqueDesigns, formatPrice } from '@/lib/catalog';
import { saleOf } from '@/lib/promo';
import { itemListSchema, breadcrumbSchema } from '@/lib/schema';
import { syncPrices } from '@/lib/livePrices';

export const metadata: Metadata = {
  title: 'כל התכשיטים',
  description:
    'כל התכשיטים של מִקְרָא בעמוד אחד: שרשראות וצמידים לאישה ולגבר, וסיכה לתינוק. בכל אחד שבב קטן עם ברכה שלמה.',
  alternates: { canonical: '/catalog' },
};

/** כל הדגמים בעמוד אחד. כל כפתור "לקטלוג" באתר מגיע לכאן */
export default async function CatalogPage() {
  await syncPrices();
  const all = uniqueDesigns(PRODUCTS);
  const prices = PRODUCTS.map((p) => saleOf(p.price).now);

  return (
    <>
      <JsonLd
        data={[
          itemListSchema(all, '/catalog'),
          breadcrumbSchema([
            { name: 'מִקְרָא', path: '/' },
            { name: 'כל התכשיטים', path: '/catalog' },
          ]),
        ]}
      />
      <section className="shell pb-24 pt-32 md:pt-36">
        <nav className="mb-6 flex items-center gap-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
          <Link href="/" className="link-u">בית</Link>
          <span>/</span>
          <span style={{ color: 'var(--accent)' }}>כל התכשיטים</span>
        </nav>
        <h1 className="display t-1">כל התכשיטים</h1>
        <p className="lede mt-4 max-w-xl">
          בוחרים תכשיט, ואז בעמוד שלו בוחרים את הברכה שתיחרט על השבב. מ־
          <span className="num">{formatPrice(Math.min(...prices))}</span> עד{' '}
          <span className="num">{formatPrice(Math.max(...prices))}</span>.
        </p>
        <div className="mt-10">
          <CatalogGrid />
        </div>
      </section>
    </>
  );
}
