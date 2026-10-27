import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { RABBINATE } from '@/lib/rabbinate';

export const metadata: Metadata = {
  title: 'אישור הרבנות',
  description: `${RABBINATE.issuer} עבר על הפסוקים והברכות שעל השבבים של מקרא ואישר אותם. אפשר להיכנס עם התכשיטים לשירותים.`,
  alternates: { canonical: RABBINATE.href },
};

/**
 * מכתב האישור של לשכת הרבנות, כמו שהוא, עם תמליל ומה הוא אומר.
 * הנתונים ב-lib/rabbinate.ts.
 */
export default function RabbinatePage() {
  return (
    <section className="pb-28 pt-32 md:pt-40">
      <div className="shell max-w-3xl">
        <h1 className="display t-1">אישור הרבנות</h1>
        <p className="lede mt-4">
          {RABBINATE.signer} עבר על הפסוקים והברכות שחורטים על השבבים של מקרא, ואישר אותם. זה המכתב,
          מ{RABBINATE.dateHe} ({RABBINATE.date}).
        </p>

        <ul className="mt-8 grid gap-3">
          {RABBINATE.points.map((p) => (
            <li
              key={p}
              className="p-4"
              style={{ borderRadius: 'var(--radius)', border: '1px solid var(--line-strong)', background: 'var(--surface)' }}
            >
              {p}
            </li>
          ))}
        </ul>

        <figure className="mt-10">
          <a href={RABBINATE.image.src} target="_blank" rel="noopener noreferrer" className="block">
            <Image
              src={RABBINATE.image.src}
              alt={`מכתב האישור של ${RABBINATE.issuer}, ${RABBINATE.date}`}
              width={RABBINATE.image.w}
              height={RABBINATE.image.h}
              sizes="(max-width: 768px) 100vw, 720px"
              className="h-auto w-full shadow-md"
              style={{ border: '1px solid var(--line)' }}
            />
          </a>
          <figcaption className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
            לחיצה על המכתב פותחת אותו בגודל מלא.
          </figcaption>
        </figure>

        <h2 className="display mt-12" style={{ fontSize: 'var(--fs-lg)' }}>
          מה כתוב במכתב
        </h2>
        <div className="mt-4 grid gap-3" style={{ color: 'var(--ink-2)', lineHeight: 1.8 }}>
          {RABBINATE.transcript.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>

        <p className="mt-12">
          <Link href="/catalog" className="btn btn-solid" style={{ ['--pad' as string]: '1rem 2.4rem' }}>
            לקטלוג
          </Link>
        </p>
      </div>
    </section>
  );
}
