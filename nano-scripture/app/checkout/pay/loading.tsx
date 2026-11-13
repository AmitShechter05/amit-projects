import PayTrust, { PayTrustStrip } from '@/components/PayTrust';
import { GROW_SDK, GROW_ORIGIN } from '@/lib/growSdk';

/**
 * מה שהלקוח רואה מיד אחרי "לתשלום", בזמן שהשרת מבקש מ-Grow אסימון
 * להזמנה (13.11.2026). קודם המסך נשאר על הקופה עד שהעמוד היה מוכן,
 * וזה הרגיש תקוע. בינתיים הדפדפן כבר מוריד את חלון התשלום של Grow.
 */
export default function PayLoading() {
  return (
    <section className="pb-24 pt-32 md:pt-40">
      <link rel="preconnect" href={GROW_ORIGIN} />
      <link rel="preload" as="script" href={GROW_SDK} />
      <div className="shell">
        <div className="mx-auto max-w-xl">
          <PayTrustStrip className="mb-4" />
          <h1 className="display t-2 text-center">תשלום מאובטח</h1>
          <p className="mt-2 text-center" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
            ההזמנה נשמרה. מכינים את חלון התשלום…
          </p>
          <div
            className="mt-8 animate-pulse"
            aria-hidden
            style={{ height: 170, borderRadius: 'var(--radius-lg)', background: 'var(--bg-2)' }}
          />
          <div
            className="mt-6 animate-pulse"
            aria-hidden
            style={{ height: 50, borderRadius: 'var(--radius)', background: 'var(--accent-fill)', opacity: 0.55 }}
          />
          <PayTrust className="mt-6" />
        </div>
      </div>
    </section>
  );
}
