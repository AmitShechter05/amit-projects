'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS, uniqueDesigns, type Product } from '@/lib/catalog';

/**
 * כל התכשיטים, עם סינון.
 *
 * עמית (6.10.2026): לקוחות לא מתמצאים באתר. עד אז כל כפתור "לקטלוג"
 * הוביל לשרשראות בלבד, ומי שחיפש צמיד או מתנה לגבר היה צריך לנחש איפה.
 * כאן כל הדגמים בעמוד אחד, ושתי שורות סינון: למי, ואיזה סוג.
 *
 * הבחירה נשמרת בכתובת (?for=men&type=bracelets), כך שאפשר לשלוח קישור
 * ישר ל"צמידים לגבר" ממודעה או ממדריך. היא נקראת אחרי הטעינה ולא בזמן
 * הרינדור, כי העמוד נבנה סטטית והשרת לא יודע מה בכתובת.
 */

type For = 'all' | 'women' | 'men' | 'baby';
type Kind = 'all' | 'necklaces' | 'bracelets';

const FOR: { id: For; label: string }[] = [
  { id: 'all', label: 'הכול' },
  { id: 'women', label: 'לאישה' },
  { id: 'men', label: 'לגבר' },
  { id: 'baby', label: 'לתינוק' },
];
const KIND: { id: Kind; label: string }[] = [
  { id: 'all', label: 'כל הסוגים' },
  { id: 'necklaces', label: 'שרשראות' },
  { id: 'bracelets', label: 'צמידים' },
];

function matches(p: Product, f: For, k: Kind) {
  if (f === 'baby') return p.category === 'pins';
  if (f === 'women' && p.audience !== 'women') return false;
  if (f === 'men' && p.audience !== 'men') return false;
  if (k !== 'all' && p.category !== k) return false;
  return true;
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={{
        flexShrink: 0,
        padding: '.62rem 1.25rem',
        borderRadius: 'var(--radius)',
        fontSize: 'var(--fs-sm)',
        whiteSpace: 'nowrap',
        border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
        background: on ? 'var(--accent)' : 'transparent',
        color: on ? 'var(--on-accent)' : 'var(--ink-2)',
        transition: 'all .3s var(--ease)',
      }}
    >
      {children}
    </button>
  );
}

export default function CatalogGrid() {
  const [f, setF] = useState<For>('all');
  const [k, setK] = useState<Kind>('all');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const qf = q.get('for') as For | null;
    const qk = q.get('type') as Kind | null;
    if (qf && FOR.some((x) => x.id === qf)) setF(qf);
    if (qk && KIND.some((x) => x.id === qk)) setK(qk);
  }, []);

  const choose = (nf: For, nk: Kind) => {
    setF(nf);
    setK(nk);
    const q = new URLSearchParams();
    if (nf !== 'all') q.set('for', nf);
    if (nk !== 'all' && nf !== 'baby') q.set('type', nk);
    const s = q.toString();
    window.history.replaceState(null, '', s ? `?${s}` : window.location.pathname);
  };

  // דגם בשני צבעים מופיע פעם אחת; את הצבע בוחרים בעמוד שלו
  const list = uniqueDesigns(PRODUCTS.filter((p) => matches(p, f, k)));

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="למי">
          {FOR.map((x) => (
            <Chip key={x.id} on={f === x.id} onClick={() => choose(x.id, x.id === 'baby' ? 'all' : k)}>
              {x.label}
            </Chip>
          ))}
        </div>
        {/* לתינוק יש רק סיכה, ולכן אין שם מה לסנן לפי סוג */}
        {f !== 'baby' && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="סוג התכשיט">
            {KIND.map((x) => (
              <Chip key={x.id} on={k === x.id} onClick={() => choose(f, x.id)}>
                {x.label}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }} aria-live="polite">
        {list.length === 1 ? 'תכשיט אחד' : `${list.length} תכשיטים`}
      </p>

      {/* reveal-off: הכרטיסים מתחלפים בלחיצה, ואנימציית הכניסה בגלילה
          הייתה משאירה כרטיסים חדשים שקופים */}
      <div className="reveal-off mt-5 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        {list.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}
