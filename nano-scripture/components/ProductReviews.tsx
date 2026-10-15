import type { ReviewSummary } from '@/lib/reviews';

/**
 * הביקורות של הדגם, מתחת לעמוד המוצר. רק ביקורות שאושרו בווקומרס, בלי
 * סינון לפי ציון. כשאין ביקורות - לא מוצג כלום (לא "0 ביקורות").
 */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span aria-label={`${value} מתוך 5`} role="img" style={{ display: 'inline-flex', gap: 2, direction: 'ltr' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 2.6l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z"
            fill={value >= n - 0.25 ? 'var(--accent)' : 'none'}
            stroke="var(--accent)"
            strokeWidth="1.4"
          />
        </svg>
      ))}
    </span>
  );
}

export default function ProductReviews({ summary }: { summary?: ReviewSummary }) {
  if (!summary || !summary.count) return null;
  return (
    <section className="py-16" style={{ borderTop: '1px solid var(--line)' }} id="reviews">
      <div className="shell max-w-3xl">
        <div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h2 className="display t-3">מה אומרים מי שקנו</h2>
          <span className="flex items-center gap-2" style={{ color: 'var(--ink-2)', fontSize: 'var(--fs-sm)' }}>
            <Stars value={summary.avg} />
            <span className="num">{summary.avg.toFixed(1)}</span>·<span>{summary.count === 1 ? 'ביקורת אחת' : `${summary.count} ביקורות`}</span>
          </span>
        </div>
        <ul className="grid gap-4">
          {summary.items.slice(0, 20).map((r, i) => (
            <li key={i} className="p-5" style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span style={{ fontWeight: 600 }}>{r.name}</span>
                <Stars value={r.rating} size={14} />
              </div>
              {r.text && <p style={{ color: 'var(--ink-2)', lineHeight: 1.7 }}>{r.text}</p>}
            </li>
          ))}
        </ul>
        <p className="mt-4" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
          ביקורות מלקוחות שקנו באתר. אנחנו לא מסננים לפי ציון.
        </p>
      </div>
    </section>
  );
}
