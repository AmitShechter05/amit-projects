import { POLICY } from '@/lib/policy';
import { COMPANY, waHref } from '@/lib/company';

/**
 * מה שנותן ביטחון בעמוד התשלום (עמית, 13.11.2026: "אין שום דבר שנותן
 * ללקוח ביטחון"). רק עובדות שיש להן מקור בקוד: מי סולק, שפרטי הכרטיס לא
 * עוברים דרכנו, מדיניות ההחזרה והאחריות, ואדם אמיתי בוואטסאפ. בלי תגי
 * תקן או "מאובטח 100%" שאין לנו מסמך עליהם.
 */
const Lock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 3 }}>
    <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * פס קצר לראש עמוד התשלום. רק עובדות: האתר כולו ב-HTTPS (SSL), החיוב אצל
 * Grow, ומדיניות ההחזרה. בלי דירוג כוכבים - עד שיש ביקורות מאושרות אין
 * מספר אמיתי להציג (CLAUDE.md: אין דירוגים מומצאים).
 */
export function PayTrustStrip({ className = '' }: { className?: string }) {
  return (
    <p
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${className}`}
      style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}
    >
      <span className="inline-flex items-center gap-1.5" style={{ fontWeight: 700, color: 'var(--ink)' }}>
        <Lock />
        חיבור מאובטח (SSL)
      </span>
      <span aria-hidden>·</span>
      <span>סליקה ישראלית דרך Grow</span>
      <span aria-hidden>·</span>
      <span>החזרה תוך {POLICY.returnDays} יום</span>
    </p>
  );
}

export default function PayTrust({ className = '' }: { className?: string }) {
  const rows = [
    'החיוב נעשה אצל Grow (משולם), חברת סליקה ישראלית. פרטי הכרטיס לא עוברים דרכנו ולא נשמרים אצלנו.',
    `עד ${POLICY.maxInstallments} תשלומים בלי ריבית.`,
    `לא מתאים? החזרה תוך ${POLICY.returnDays} יום. שנה אחריות על התכשיט.`,
    'אחרי התשלום מגיע אישור הזמנה במייל.',
  ];
  return (
    <div
      className={`p-4 ${className}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)' }}
    >
      <p className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
        <Lock />
        תשלום מאובטח
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r} className="flex items-start gap-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)', lineHeight: 1.55 }}>
            <Check />
            <span>{r}</span>
          </li>
        ))}
      </ul>
      {COMPANY.whatsapp && waHref && (
        <p className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line)', fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}>
          שאלה לפני שמשלמים?{' '}
          <a href={waHref} className="link-u" style={{ color: 'var(--accent-deep)', fontWeight: 500 }} target="_blank" rel="noopener">
            כתבו לנו בוואטסאפ, {COMPANY.whatsapp}
          </a>
        </p>
      )}
    </div>
  );
}
