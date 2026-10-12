import type { Metadata } from 'next';
import FailedView from './FailedView';

export const metadata: Metadata = {
  title: 'התשלום לא עבר',
  robots: { index: false, follow: false },
};

export default function FailedPage() {
  return (
    <section className="pb-32 pt-36 md:pt-40">
      <div className="shell">
        <FailedView />
      </div>
    </section>
  );
}
