'use client';

import Link from 'next/link';
import { useState } from 'react';
import { GIFT_AMOUNTS, type GiftAmount } from '@/lib/giftcard';

const field = {
  height: 46,
  width: '100%',
  padding: '0 .8rem',
  border: '1px solid var(--line-strong)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  fontSize: 'var(--fs-sm)',
} as const;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--sale)' }}>{error}</span>}
    </label>
  );
}

export default function GiftCardForm() {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState<GiftAmount>(500);
  const [toName, setToName] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [from, setFrom] = useState('');
  const [message, setMessage] = useState('');
  const [sendDate, setSendDate] = useState(today);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setErrors({});
    try {
      const r = await fetch('/api/giftcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          to: { name: toName, email: toEmail },
          from,
          message,
          sendDate: sendDate > today ? sendDate : '',
          buyer: { firstName, lastName, email, phone },
          terms,
          marketing,
        }),
      });
      const data = (await r.json()) as { payment?: string; error?: string; fields?: Record<string, string> };
      if (data.payment) {
        window.location.href = data.payment;
        return;
      }
      setErrors(data.fields ?? {});
      setError(data.error ?? 'משהו השתבש. נסו שוב.');
    } catch {
      setError('משהו השתבש. נסו שוב.');
    }
    setBusy(false);
  };

  return (
    <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.1fr]">
      {/* הכרטיס עצמו, כפי שיגיע */}
      <div>
        <div
          className="relative flex aspect-[1.6] flex-col justify-between p-6"
          style={{
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(140deg, #1d1a16, #3a3326 60%, #6b5a36)',
            color: '#fbf8f1',
            boxShadow: '0 20px 40px -18px rgb(30 25 15 / .45)',
          }}
        >
          <span className="display" style={{ fontSize: 'var(--fs-md)' }}>מִקְרָא</span>
          <div>
            <p style={{ fontSize: 'var(--fs-xs)', color: '#c9a35a', fontWeight: 600 }}>כרטיס מתנה{toName ? ` ל${toName}` : ''}</p>
            <p className="num display" style={{ fontSize: '2.6rem', lineHeight: 1.1 }}>₪{amount}</p>
          </div>
        </div>
        <div role="radiogroup" aria-label="סכום" className="mt-4 grid grid-cols-3 gap-2">
          {GIFT_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={a === amount}
              onClick={() => setAmount(a)}
              className="num py-3"
              style={{
                borderRadius: 'var(--radius)',
                border: `1.5px solid ${a === amount ? 'var(--accent)' : 'var(--line)'}`,
                background: a === amount ? 'color-mix(in oklab, var(--accent) 10%, var(--surface))' : 'var(--surface)',
                fontWeight: 600,
              }}
            >
              ₪{a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <p className="display" style={{ fontSize: 'var(--fs-md)' }}>למי?</p>
        <Field label="השם של מי שמקבל" error={errors.toName}>
          <input value={toName} onChange={(e) => setToName(e.target.value)} style={field} />
        </Field>
        <Field label="המייל שאליו נשלח את הכרטיס" error={errors.toEmail}>
          <input type="email" dir="ltr" value={toEmail} onChange={(e) => setToEmail(e.target.value)} style={{ ...field, textAlign: 'right' }} />
        </Field>
        <Field label="מאת (איך לחתום)">
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="למשל: נועה ודני" style={field} />
        </Field>
        <Field label="כמה מילים משלכם (לא חובה)">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={400} rows={3} style={{ ...field, height: 'auto', padding: '.6rem .8rem' }} />
        </Field>
        <Field label="מתי לשלוח?">
          <input type="date" min={today} value={sendDate} onChange={(e) => setSendDate(e.target.value)} style={field} />
        </Field>

        <p className="display mt-2" style={{ fontSize: 'var(--fs-md)' }}>הפרטים שלכם</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="שם פרטי" error={errors.firstName}>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={field} />
          </Field>
          <Field label="שם משפחה">
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={field} />
          </Field>
        </div>
        <Field label="מייל (לשם נשלח עותק של הכרטיס)" error={errors.email}>
          <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...field, textAlign: 'right' }} />
        </Field>
        <Field label="טלפון" error={errors.phone}>
          <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...field, textAlign: 'right' }} />
        </Field>

        <label className="flex items-start gap-2" style={{ fontSize: 'var(--fs-sm)' }}>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1" />
          <span>
            קראתי ואני מסכים/ה ל<Link href="/legal/terms" className="link-u" target="_blank">תקנון</Link>
            {errors.terms && <span style={{ color: 'var(--sale)' }}> · {errors.terms}</span>}
          </span>
        </label>
        <label className="flex items-start gap-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1" />
          <span>אפשר לשלוח לי מדי פעם מיילים על תכשיטים חדשים ומבצעים (לא חובה)</span>
        </label>

        <button type="button" onClick={submit} disabled={busy} className="btn btn-solid mt-2" style={{ opacity: busy ? 0.6 : 1 }}>
          {busy ? 'רגע…' : `לתשלום · ₪${amount}`}
        </button>
        {error && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--sale)' }}>{error}</p>}
      </div>
    </div>
  );
}
