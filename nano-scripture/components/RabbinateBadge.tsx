import Image from 'next/image';
import Link from 'next/link';
import { RABBINATE } from '@/lib/rabbinate';

/**
 * כרטיס "באישור לשכת הרבנות": תמונה קטנה של המכתב, מי חתם, ושתי
 * הנקודות שהוא אומר. לחיצה פותחת את /rabbinate עם המכתב המלא.
 * בשימוש בעמוד המוצר (ליד הכפתור) ובעמוד הבית.
 */
export default function RabbinateBadge({ className = '' }: { className?: string }) {
  return (
    <Link
      href={RABBINATE.href}
      className={`flex items-center gap-4 p-4 text-start ${className}`}
      style={{
        borderRadius: 'var(--radius)',
        border: '1px solid var(--line-strong)',
        background: 'var(--surface)',
      }}
    >
      <Image
        src={RABBINATE.thumb.src}
        alt={`מכתב האישור של ${RABBINATE.issuer}`}
        width={RABBINATE.thumb.w}
        height={RABBINATE.thumb.h}
        className="h-auto w-14 shrink-0 shadow-sm"
        style={{ border: '1px solid var(--line)' }}
      />
      <span className="flex-1">
        <span className="display block" style={{ fontSize: 'var(--fs-base)' }}>
          באישור {RABBINATE.issuer}
        </span>
        <span className="mt-1 block" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)', lineHeight: 1.6 }}>
          {RABBINATE.signer} עבר על הפסוקים והברכות שעל השבבים ואישר אותם. ואפשר להיכנס איתם לשירותים.
        </span>
        <span className="link-u mt-1 inline-block" style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-deep)' }}>
          למכתב המלא ←
        </span>
      </span>
    </Link>
  );
}
