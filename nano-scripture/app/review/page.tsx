import type { Metadata } from 'next';
import Link from 'next/link';
import { findOrder } from '@/lib/paySummary';
import { getProductBySku } from '@/lib/catalog';
import ReviewForm, { type ReviewItem } from './ReviewForm';

export const metadata: Metadata = {
  title: 'איך התכשיט?',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

/**
 * כתיבת ביקורת. מגיעים לכאן מהקישור האישי במייל של אחרי ההזמנה
 * (?o=<הזמנה>&k=<מפתח>&s=<כוכבים>), ולכן רק מי שקנה יכול לכתוב. הביקורת
 * נשמרת בווקומרס כממתינה, ומופיעה באתר אחרי אישור (lib/reviews.ts).
 */
export default async function ReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const order = await findOrder(sp.o, sp.k);
  const paid = order && ['processing', 'completed'].includes(order.status ?? '');

  if (!order || !paid) {
    return (
      <section className="pb-32 pt-36 md:pt-44">
        <div className="shell max-w-lg text-center">
          <h1 className="display t-2">הקישור לא תקין</h1>
          <p className="lede mt-4">
            כדי לכתוב ביקורת צריך את הקישור מהמייל שקיבלתם אחרי ההזמנה. אם הוא לא עובד - כתבו לנו, ונשלח קישור חדש.
          </p>
          <Link href="/" className="btn btn-solid mt-8 inline-block">
            לדף הבית
          </Link>
        </div>
      </section>
    );
  }

  // דגם אחד לכל שם: כסף וזהב של אותו דגם הם ביקורת אחת
  const seen = new Set<string>();
  const items: ReviewItem[] = [];
  for (const l of order.line_items ?? []) {
    const p = l.sku ? getProductBySku(l.sku) : undefined;
    if (!p || seen.has(p.name)) continue;
    seen.add(p.name);
    const blessing = (l.meta_data ?? []).find((m) => m.key === 'הברכה')?.value;
    items.push({ slug: p.slug, sku: p.sku, name: p.name, image: p.image, blessing: typeof blessing === 'string' ? blessing : '' });
  }
  const billing = (order as unknown as { billing?: { first_name?: string; last_name?: string } }).billing;
  const last = billing?.last_name?.trim();
  const defaultName = [billing?.first_name?.trim(), last ? `${last[0]}.` : ''].filter(Boolean).join(' ');
  const stars = Math.min(5, Math.max(0, Math.round(Number(sp.s) || 0)));

  return (
    <section className="pb-32 pt-32 md:pt-40">
      <div className="shell max-w-xl">
        <h1 className="display t-2">איך התכשיט?</h1>
        <p className="lede mt-3">שתי דקות שלכם יעזרו למישהו אחר להחליט. כתבו בכנות - אנחנו לא מסננים לפי ציון.</p>
        <ReviewForm o={String(order.id)} k={sp.k ?? ''} items={items} defaultName={defaultName} defaultStars={stars} />
      </div>
    </section>
  );
}
