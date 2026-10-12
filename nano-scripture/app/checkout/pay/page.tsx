import type { Metadata } from 'next';
import PayFrame from './PayFrame';

export const metadata: Metadata = {
  title: 'תשלום מאובטח',
  robots: { index: false, follow: false },
};

export default function PayPage() {
  return (
    <section className="pb-24 pt-32 md:pt-40">
      <div className="shell">
        <PayFrame />
      </div>
    </section>
  );
}
