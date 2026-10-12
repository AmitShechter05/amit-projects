import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'הוסרת מרשימת התפוצה',
  robots: { index: false, follow: false },
};

/**
 * לכאן מגיעים מקישור ההסרה בתחתית מיילי השיווק. ההסרה עצמה כבר
 * בוצעה בוורדפרס (התוסף mikra-store, includes/marketing.php) לפני
 * ההפניה, כך שהעמוד רק מאשר.
 */
export default function UnsubscribedPage() {
  return (
    <section className="pb-32 pt-36 md:pt-44">
      <div className="shell max-w-lg text-center">
        <h1 className="display t-2">הוסרת מרשימת התפוצה</h1>
        <p className="lede mt-4">
          לא נשלח לך יותר מיילים על מבצעים ותכשיטים חדשים. מיילים על הזמנה שעשית, כמו אישור ומשלוח, ימשיכו להגיע.
        </p>
        <p className="mt-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
          הוסרת בטעות? אפשר להירשם שוב בתחתית האתר.
        </p>
        <Link href="/" className="btn btn-solid mt-8 inline-block">
          לדף הבית
        </Link>
      </div>
    </section>
  );
}
