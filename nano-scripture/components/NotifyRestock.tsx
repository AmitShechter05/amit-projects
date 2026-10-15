'use client';

import { useState } from 'react';
import type { Blessing } from '@/lib/blessings';

/**
 * "תודיעו לי כשחוזר" - מתחת לבורר הברכה, כשאחת הברכות (או כולן) אזלה.
 * מייל אחד כשהברכה חוזרת, ותו לא (app/api/notify → התוסף).
 */
export default function NotifyRestock({ slug, out }: { slug: string; out: Blessing[] }) {
  const [open, setOpen] = useState(false);
  const [blessing, setBlessing] = useState(out[0]?.id);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  if (!out.length) return null;

  const submit = async () => {
    setState('busy');
    setError(null);
    try {
      const r = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, blessing, email }),
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

  if (state === 'done') {
    return (
      <p className="mt-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
        נשמר. נשלח מייל אחד כשזה חוזר למלאי.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="link-u mt-3"
        style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}
      >
        {out.length === 1 ? `${out[0].plain} אזלה?` : 'ברכה שאזלה?'} נודיע לך כשהיא חוזרת ←
      </button>
    );
  }

  return (
    <div className="mt-3 p-3" style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink)' }}>נשלח לך מייל אחד כשזה חוזר למלאי.</p>
      {out.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="איזו ברכה">
          {out.map((b) => (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={b.id === blessing}
              onClick={() => setBlessing(b.id)}
              className="px-3 py-1.5"
              style={{
                fontSize: 'var(--fs-xs)',
                borderRadius: 999,
                border: `1px solid ${b.id === blessing ? b.accent : 'var(--line)'}`,
                background: b.id === blessing ? `color-mix(in oklab, ${b.accentSoft} 55%, var(--surface))` : 'var(--surface)',
              }}
            >
              {b.plain}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <input
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && email.trim()) submit();
          }}
          placeholder="כתובת מייל"
          aria-label="כתובת מייל"
          className="min-w-0 flex-1 px-3"
          style={{ height: 44, fontSize: 'var(--fs-sm)', borderRadius: 'var(--radius)', border: '1px solid var(--line-strong)', background: 'var(--surface)', textAlign: 'right' }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!email.trim() || state === 'busy'}
          className="btn btn-solid"
          style={{ ['--pad' as string]: '0 1.1rem', height: 44, fontSize: 'var(--fs-sm)', opacity: email.trim() && state !== 'busy' ? 1 : 0.5 }}
        >
          {state === 'busy' ? 'שומר…' : 'להודיע לי'}
        </button>
      </div>
      {error && (
        <p className="mt-1.5" style={{ fontSize: 'var(--fs-xs)', color: 'var(--sale)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
