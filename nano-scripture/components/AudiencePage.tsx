import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import {
  AUDIENCE_PAGES,
  AUDIENCE_ORDER,
  ACTIVE_CATEGORIES,
  CATEGORIES,
  productsForAudience,
  formatPrice,
  type AudiencePage as Audience,
} from '@/lib/catalog';
import { saleOf } from '@/lib/promo';
import { itemListSchema, breadcrumbSchema } from '@/lib/schema';
import { syncPrices } from '@/lib/livePrices';

export function audienceMetadata(a: Audience): Metadata {
  const page = AUDIENCE_PAGES[a];
  return {
    title: page.title,
    description: page.blurb,
    alternates: { canonical: page.path },
    openGraph: { type: 'website', url: page.path, title: `${page.title} · מִקְרָא`, description: page.blurb },
  };
}

/**
 * עמוד "תכשיטים לנשים" / "תכשיטים לגברים".
 *
 * בקטלוג יש סינון "לאישה / לגבר", אבל הוא נקרא בדפדפן אחרי הטעינה. כאן
 * הרשימה נבנית בשרת, כך שיש כתובת קבועה למודעה, לתפריט ולגוגל.
 * הדגמים מחולקים לפי סוג (שרשראות, צמידים), וסוג בלי דגמים לא מוצג.
 */
export default async function AudiencePage({ audience }: { audience: Audience }) {
  await syncPrices();
  const page = AUDIENCE_PAGES[audience];
  const all = productsForAudience(audience);
  const groups = ACTIVE_CATEGORIES.map((id) => ({ id, list: productsForAudience(audience, id) })).filter(
    (g) => g.list.length > 0,
  );
  const prices = all.map((p) => saleOf(p.price).now);
  const other = AUDIENCE_ORDER.filter((x) => x !== audience).map((x) => AUDIENCE_PAGES[x]);

  return (
    <>
      <JsonLd
        data={[
          itemListSchema(all, page.path),
          breadcrumbSchema([
            { name: 'מִקְרָא', path: '/' },
            { name: page.title, path: page.path },
          ]),
        ]}
      />
      <section className="shell pb-24 pt-32 md:pt-36">
        <nav className="mb-6 flex items-center gap-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
          <Link href="/" className="link-u">בית</Link>
          <span>/</span>
          <Link href="/catalog" className="link-u">כל התכשיטים</Link>
          <span>/</span>
          <span style={{ color: 'var(--accent)' }}>{page.title}</span>
        </nav>
        <h1 className="display t-1">{page.title}</h1>
        <p className="lede mt-4 max-w-xl">{page.blurb}</p>
        <p className="mt-4" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
          <span className="num">{all.length}</span> דגמים · מ־
          <span className="num">{formatPrice(Math.min(...prices))}</span> עד{' '}
          <span className="num">{formatPrice(Math.max(...prices))}</span>
        </p>

        {groups.map((g, gi) => (
          <div key={g.id} className="mt-14">
            <h2 className="display t-3 mb-6">{CATEGORIES[g.id].title}</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {g.list.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} priority={gi === 0 && i < 3} />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-16 flex flex-wrap gap-x-8 gap-y-3" style={{ fontSize: 'var(--fs-sm)' }}>
          {other.map((o) => (
            <Link key={o.path} href={o.path} className="link-u" style={{ color: 'var(--accent-deep)' }}>
              {o.title} ←
            </Link>
          ))}
          <Link href="/catalog" className="link-u" style={{ color: 'var(--accent-deep)' }}>
            כל התכשיטים ←
          </Link>
        </div>
      </section>
    </>
  );
}
