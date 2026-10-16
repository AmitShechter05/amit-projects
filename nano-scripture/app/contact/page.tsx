import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY, telHref, waHref } from '@/lib/company';
import { POLICY } from '@/lib/policy';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'יצירת קשר',
  description: `טלפון, וואטסאפ ואימייל של מקרא. ${COMPANY.address}.`,
  alternates: { canonical: '/contact' },
};

/**
 * יצירת קשר (16.10.2026).
 *
 * Merchant Center פסל את כל המוצרים על "מצג שווא", ואחת הדרישות שם היא
 * עמוד שבו רואים מי עומד מאחורי החנות ואיך משיגים אותו. כל הפרטים מגיעים
 * מ-lib/company.ts ומ-lib/policy.ts - לא כותבים כאן מספר ביד.
 */
export default function ContactPage() {
  const row = { fontSize: 'var(--fs-base)', padding: '.9rem 0', borderBottom: '1px solid var(--line)' } as const;
  const label = { fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' } as const;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: `${SITE_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: COMPANY.legalName,
      url: SITE_URL,
      email: COMPANY.email,
      ...(COMPANY.phone ? { telephone: `+972-${COMPANY.phone.replace(/^0/, '')}` } : {}),
      address: { '@type': 'PostalAddress', streetAddress: 'גולדה מאיר 112', addressLocality: 'מודיעין', addressCountry: 'IL' },
    },
  };

  return (
    <section className="pb-28 pt-32 md:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="shell max-w-2xl">
        <h1 className="display t-1">יצירת קשר</h1>
        <p className="lede mt-4">
          שאלה על ברכה, על מידה או על הזמנה? עונים אנשים, לא בוט. הכי מהר בוואטסאפ.
        </p>

        <dl className="mt-10">
          {COMPANY.phone && telHref && (
            <div style={row}>
              <dt style={label}>טלפון</dt>
              <dd className="mt-1">
                <a href={telHref} className="link-u ltr num">{COMPANY.phone}</a>
              </dd>
            </div>
          )}
          {waHref && (
            <div style={row}>
              <dt style={label}>וואטסאפ</dt>
              <dd className="mt-1">
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="link-u">
                  לשלוח הודעה בוואטסאפ
                </a>
              </dd>
            </div>
          )}
          <div style={row}>
            <dt style={label}>אימייל</dt>
            <dd className="mt-1">
              <a href={`mailto:${COMPANY.email}`} className="link-u ltr">{COMPANY.email}</a>
            </dd>
          </div>
          <div style={row}>
            <dt style={label}>כתובת העסק</dt>
            <dd className="mt-1">{COMPANY.address}</dd>
            <dd className="mt-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
              אין חנות פתוחה לקהל. אפשר לאסוף הזמנה ממודיעין בתיאום מראש.
            </dd>
          </div>
          <div style={row}>
            <dt style={label}>פרטי העסק</dt>
            <dd className="mt-1">
              {COMPANY.legalName} · {COMPANY.regNumber}
            </dd>
          </div>
        </dl>

        <h2 className="display mt-12" style={{ fontSize: 'var(--fs-lg)' }}>לפני שכותבים</h2>
        <ul className="mt-4 grid gap-2" style={{ color: 'var(--ink-2)' }}>
          <li>
            · משלוח מבוטח {POLICY.deliveryMinDays}-{POLICY.deliveryMaxDays} ימי עסקים. החזרה תוך {POLICY.returnDays} יום.{' '}
            <Link href="/legal/shipping-returns" className="link-u">כל הפרטים</Link>
          </li>
          <li>
            · רוצים לבטל עסקה? <Link href="/legal/cancel" className="link-u">טופס ביטול</Link>
          </li>
          <li>
            · לא בטוחים איזו ברכה? <Link href="/match" className="link-u">שלוש שאלות קצרות</Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
