import type { Metadata } from 'next';
import { findOrder, summarize, payPath } from '@/lib/paySummary';
import FailedView from './FailedView';

export const metadata: Metadata = {
  title: 'התשלום לא עבר',
  robots: { index: false, follow: false },
};

/**
 * חלון התשלום שולח לכאן את ההזמנה (?o=&k=), ולכן הסיכום נקרא
 * מווקומרס ולא רק ממה שנשמר בדפדפן. כך העגלה מוצגת גם למי שהגיע
 * מקישור תשלום ששלחנו, או מטלפון אחר (עמית, 12.10.2026).
 */
export default async function FailedPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string; k?: string }>;
}) {
  const { o, k } = await searchParams;
  const order = await findOrder(o, k);
  const fromOrder =
    order && ['pending', 'failed'].includes(order.status ?? '')
      ? { number: order.number, retry: payPath(order), summary: summarize(order) }
      : null;

  return (
    <section className="pb-32 pt-36 md:pt-40">
      <div className="shell">
        <FailedView fromOrder={fromOrder} />
      </div>
    </section>
  );
}
