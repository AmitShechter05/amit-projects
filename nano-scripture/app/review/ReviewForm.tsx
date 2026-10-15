'use client';

import Image from 'next/image';
import { useState } from 'react';
import { packshotFit } from '@/lib/catalog';

export type ReviewItem = { slug: string; sku: string; name: string; image: string; blessing: string };

const STAR = 'M12 2.6l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z';

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label="ציון" className="flex gap-1" style={{ direction: 'ltr' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} כוכבים`}
          onClick={() => onChange(n)}
          className="tap"
          style={{ padding: 4 }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden>
            <path d={STAR} fill={value >= n ? 'var(--accent)' : 'none'} stroke="var(--accent)" strokeWidth="1.4" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ItemForm({
  o,
  k,
  item,
  defaultName,
  defaultStars,
}: {
  o: string;
  k: string;
  item: ReviewItem;
  defaultName: string;
  defaultStars: number;
}) {
  const [rating, setRating] = useState(defaultStars);
  const [text, setText] = useState('');
  const [name, setName] = useState(defaultName);
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setState('busy');
    setError(null);
    try {
      const r = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ o, k, sku: item.sku, rating, text, name }),
      });
      const data = (await r.json()) as { ok: boolean; error?: string };
      if (data.ok) setState('done');
      else {
        setError(data.error ?? 'משהו השתבש. נסו שוב.');
        setState('idle');
      }
    } catch {
      setError('משהו השתבש. נסו שוב.');
      setState('idle');
    }
  };

  const ready = rating > 0 && name.trim() && state !== 'busy';

  return (
    <div className="mt-8 p-5" style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)' }}>
      <div className="flex items-center gap-4">
        <span className="tile relative block shrink-0 overflow-hidden" style={{ width: 72, height: 72, borderRadius: 'var(--radius)' }}>
          <Image src={item.image} alt="" fill sizes="72px" className={packshotFit(item.image, 'p-1.5')} />
        </span>
        <div>
          <p className="display" style={{ fontSize: 'var(--fs-md)' }}>
            {item.name}
          </p>
          {item.blessing && <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>ברכה: {item.blessing}</p>}
        </div>
      </div>

      {state === 'done' ? (
        <p className="mt-5" style={{ color: 'var(--ink-2)' }}>
          תודה! הביקורת נשמרה, והיא תופיע באתר אחרי שנעבור עליה.
        </p>
      ) : (
        <>
          <div className="mt-5">
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <label className="mt-4 block">
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
              מה תרצו לספר? למי נתתם, איך הגיבו, איך זה נראה
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={1500}
              className="mt-1.5 w-full p-3"
              style={{ border: '1px solid var(--line-strong)', borderRadius: 'var(--radius)', background: 'var(--bg)', fontSize: 'var(--fs-sm)' }}
            />
          </label>
          <label className="mt-3 block">
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>השם שיופיע (אפשר שם פרטי בלבד)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="mt-1.5 w-full px-3"
              style={{ height: 44, border: '1px solid var(--line-strong)', borderRadius: 'var(--radius)', background: 'var(--bg)', fontSize: 'var(--fs-sm)' }}
            />
          </label>
          <button type="button" onClick={submit} disabled={!ready} className="btn btn-solid mt-4" style={{ opacity: ready ? 1 : 0.5 }}>
            {state === 'busy' ? 'שולח…' : 'לשלוח ביקורת'}
          </button>
          {error && (
            <p className="mt-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--sale)' }}>
              {error}
            </p>
          )}
          <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
            יש תמונה של התכשיט? נשמח לראות - שלחו אותה בתשובה למייל שקיבלתם.
          </p>
        </>
      )}
    </div>
  );
}

export default function ReviewForm(props: { o: string; k: string; items: ReviewItem[]; defaultName: string; defaultStars: number }) {
  return (
    <>
      {props.items.map((item) => (
        <ItemForm key={item.sku} o={props.o} k={props.k} item={item} defaultName={props.defaultName} defaultStars={props.defaultStars} />
      ))}
    </>
  );
}
