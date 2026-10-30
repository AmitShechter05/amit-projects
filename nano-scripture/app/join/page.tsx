import type { Metadata } from 'next';
import JoinOffer from './JoinOffer';

export const metadata: Metadata = {
  title: 'להוסיף לאותה חבילה',
  // עמוד אישי של הזמנה, עם מפתח בכתובת. לא לחיפוש
  robots: { index: false, follow: false },
};

export default function JoinPage() {
  return (
    <section className="shell pb-24 pt-32 md:pt-36">
      <JoinOffer />
    </section>
  );
}
