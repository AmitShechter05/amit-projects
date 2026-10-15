'use client';

import { useEffect, useState } from 'react';
import { nextOccasionDeadline } from '@/lib/occasions';

/**
 * "רוצים שיגיע לחנוכה? להזמין עד יום חמישי 3.12, 18:00"
 *
 * למה רק אחרי ההרכבה: העמודים נבנים מראש, והשרת לא יודע באיזה יום
 * יקראו אותם. חישוב בשרת היה נותן תאריך של יום הבנייה, ואז הדפדפן היה
 * מחשב תאריך אחר - שגיאת hydration ושורה שמבטיחה משהו לא נכון. לכן
 * בשרת לא מוצג כלום, והשורה מופיעה רק בדפדפן, לפי השעה בישראל.
 * כשאין מועד קרוב - לא מוצג כלום, גם בדפדפן.
 *
 * variant="bar" - פריט ברצועת ההצעות (עם הנקודה שלפניו, בצבע הרצועה).
 * בלי variant - שורה קטנה ושקטה, כמו DeliveryEstimate.
 */
export default function OccasionDeadline({ variant = 'line' }: { variant?: 'line' | 'bar' }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(nextOccasionDeadline()?.label ?? null);
  }, []);

  if (!label) return null;

  if (variant === 'bar') {
    return (
      <span className="flex items-center">
        <span aria-hidden style={{ opacity: 0.45, padding: '0 1.15rem' }}>
          ·
        </span>
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            letterSpacing: '.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </span>
    );
  }

  return (
    <p
      className="mt-3 flex items-center justify-center gap-2"
      style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden style={{ color: 'var(--accent)' }}>
        <path
          d="M4.5 9.5h15v10h-15zM3.5 6.5h17v3h-17zM12 6.5v13M12 6.5c-1.6-2.6-4.6-3-4.6-1.1 0 1.3 2.4 1.1 4.6 1.1Zm0 0c1.6-2.6 4.6-3 4.6-1.1 0 1.3-2.4 1.1-4.6 1.1Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </p>
  );
}
