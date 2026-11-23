'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { syncViewed } from '@/lib/viewed';
import { rememberShopper } from '@/lib/shopper';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { PROMO, promoOn } from '@/lib/promo';
import { validateLead, EMPTY_LEAD, type Lead, type LeadErrors } from '@/lib/subscribe';
import { trackLead } from '@/lib/analytics';

const SEEN = 'mikra:club';
/** אירוע שהכפתור הצף שולח כדי לפתוח את החלון */
export const CLUB_OPEN = 'mikra:club-open';
/** מי שכבר הצטרף - הכפתור הצף נעלם אצלו */
export const CLUB_JOINED = 'mikra:club-joined';
/** כמה עמודים נצפו בביקור הזה. sessionStorage - נמחק עם הלשונית */
const VIEWS = 'mikra:views';
/** מהעמוד השני: אחרי 25 שניות או 40% גלילה, ולא ב-8 השניות הראשונות */
const DELAY_MS = 25_000;
const SCROLL_TRIGGER = 0.4;
const MIN_ON_PAGE_MS = 8_000;
/**
 * בעמוד הראשון של הביקור (מ-23.11.2026): רוב המבקרים מגיעים ממודעה
 * ישר לעמוד מוצר ויוצאים אחרי עמוד אחד (גוגל אנליטיקס 15-22.11: כ-14
 * שניות בממוצע), ולכן הכלל "רק מהעמוד השני" הסתיר את הפופאפ מרובם.
 * בעמוד הראשון הוא נפתח רק אחרי מעורבות אמיתית: 20 שניות וגם חצי עמוד
 * גלילה, או 40 שניות בעמוד. במחשב - גם כשהעכבר יוצא לסגור את הלשונית.
 */
const FIRST_MIN_MS = 20_000;
const FIRST_SCROLL = 0.5;
const FIRST_DELAY_MS = 40_000;

/**
 * הצטרפות למועדון, בתמורה לקוד ההנחה.
 *
 * ------------------------------------------------------------------
 * מתי הוא נפתח - לפי המחקר, לא לפי תחושה.
 *
 * NN/g (2017, 452 נשאלים, 23 פורמטים): חלון קופץ הוא הפורמט השנוא
 * ביותר, בדסקטופ ובמובייל - ובמיוחד כשהוא מקדים את התוכן. NN/g
 * (מדרג המחויבות, 2016): לא מבקשים מידע אישי לפני שענו על צורכי
 * האמון הבסיסיים - רלוונטיות ואמינות באות קודם. מכאן שני התנאים:
 *
 * 1. בעמוד הראשון של הביקור - רק אחרי מעורבות אמיתית (ראו FIRST_*
 *    למעלה), אף פעם לא בכניסה.
 * 2. מהעמוד השני - אחרי 40% גלילה או 25 שניות, ואף פעם לא
 *    בשמונה השניות הראשונות.
 *
 * ופעם אחת בחיי המבקר (localStorage), לא בצ'קאאוט, ולא כשהעגלה
 * פתוחה - שם כבר יש כוונת קנייה, ופופאפ הנחה קוטע אותה בשביל ליד.
 * גוגל מוריד בדירוג עמודי מובייל שחוסמים תוכן בכניסה; התנאי הראשון
 * פותר גם את זה.
 * ------------------------------------------------------------------
 */
export default function SignupPopup() {
  const pathname = usePathname();
  // מגירת העגלה יושבת על 120 ו-121, בדיוק כמו הפופאפ. אם שתיהן
  // נפתחות יחד, העגלה מצוירת מעל הפופאפ בזמן שהפופאפ לוכד את המיקוד
  // ונועל את הגלילה - והמבקר תקוע מול עגלה שאי אפשר לצאת ממנה
  const cartOpen = useCart((s) => s.open);
  const [open, setOpen] = useState(false);
  const [lead, setLead] = useState<Lead>(EMPTY_LEAD);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [failed, setFailed] = useState('');
  const [copied, setCopied] = useState(false);
  // יום הולדת - שלב רשות אחרי ההרשמה (22.11.2026). יום וחודש בלבד
  const [bday, setBday] = useState({ d: '', m: '' });
  const [bdayState, setBdayState] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');

  async function saveBirthday() {
    const hasDate = Boolean(bday.d && bday.m);
    if (!hasDate && lead.name.trim().length < 2) return;
    setBdayState('busy');
    try {
      const res = await fetch('/api/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lead.email,
          name: lead.name.trim() || undefined,
          ...(hasDate ? { day: Number(bday.d), month: Number(bday.m) } : {}),
        }),
      });
      setBdayState(res.ok ? 'saved' : 'error');
    } catch {
      setBdayState('error');
    }
  }

  const panel = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  // לאן להחזיר את המיקוד בסגירה. בלי זה הפוקוס קופץ לתחילת העמוד
  const opener = useRef<Element | null>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN, '1');
    } catch {
      /* מצב פרטי, או אחסון חסום. אין מה לעשות ואין מה להפיל */
    }
    if (opener.current instanceof HTMLElement) opener.current.focus();
  }, []);

  /* ---------- מתי להיפתח ---------- */
  useEffect(() => {
    if (!promoOn || !pathname || pathname.startsWith('/checkout') || pathname.startsWith('/legal')) return;

    let views = 0;
    try {
      if (localStorage.getItem(SEEN)) return;
      views = Number(sessionStorage.getItem(VIEWS) ?? 0) + 1;
      sessionStorage.setItem(VIEWS, String(views));
    } catch {
      return;
    }
    const first = views < 2;

    const landed = Date.now();
    let done = false;
    // force - יציאת העכבר מהחלון: מספיק שעברו 8 השניות הראשונות
    const fire = (force = false) => {
      const wait = first && !force ? FIRST_MIN_MS : MIN_ON_PAGE_MS;
      if (done || Date.now() - landed < wait) return;
      // מי שכבר בעגלה נמצא צעד לפני התשלום. פופאפ הנחה שם קוטע
      // כוונת קנייה בשביל ליד, וזו עסקה גרועה
      if (useCart.getState().open) return;
      done = true;
      opener.current = document.activeElement;
      setOpen(true);
    };
    const timer = window.setTimeout(() => fire(), first ? FIRST_DELAY_MS : DELAY_MS);
    const scrolled = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      return max > 0 && window.scrollY / max > (first ? FIRST_SCROLL : SCROLL_TRIGGER);
    };
    const onScroll = () => {
      if (scrolled()) fire();
    };
    // בעמוד הראשון: מי שכבר גלל חצי עמוד ועכשיו קורא בלי לגלול - נבדק שוב כשמגיעות 20 השניות
    const recheck = first ? window.setTimeout(() => scrolled() && fire(), FIRST_MIN_MS + 50) : 0;
    // במחשב: העכבר יוצא מראש החלון, לכיוון הלשוניות או שורת הכתובת
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) fire(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onLeave);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(recheck);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onLeave);
    };
  }, [pathname]);

  // הכפתור הצף (ClubButton) פותח את החלון בכל רגע, גם אם כבר נסגר פעם
  useEffect(() => {
    const onAsk = () => {
      if (useCart.getState().open) useCart.getState().setOpen(false);
      opener.current = document.activeElement;
      setOpen(true);
    };
    window.addEventListener(CLUB_OPEN, onAsk);
    return () => window.removeEventListener(CLUB_OPEN, onAsk);
  }, []);

  // אם העגלה נפתחה בזמן שהפופאפ מוצג, הפופאפ מתקפל
  useEffect(() => {
    if (cartOpen && open) setOpen(false);
  }, [cartOpen, open]);

  /* ---------- מקלדת ולכידת מיקוד ---------- */
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    firstField.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      // חלון מודאלי חייב ללכוד את הטאב. בלעדי זה המיקוד בורח לעמוד
      // שמאחור, והמשתמש בטאב לבדו לא יכול לא למלא ולא לסגור
      const items = panel.current.querySelectorAll<HTMLElement>(
        'button, input, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, dismiss, code]);

  if (!open) return null;

  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => {
    setLead((c) => ({ ...c, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setFailed('');
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateLead(lead);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setBusy(true);
    setFailed('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setFailed(data.error ?? 'ההרשמה נכשלה');
        return;
      }
      setCode(data.code);
      rememberShopper({ email: lead.email, name: lead.name.split(' ')[0] });
      // מה שראה לפני שנרשם - כדי שכבר מייל הפתיחה יציג את התכשיטים שלו
      syncViewed();
      trackLead();
      try {
        localStorage.setItem(SEEN, '1');
        localStorage.setItem(CLUB_JOINED, '1');
      } catch {
        /* לא קריטי */
      }
      window.dispatchEvent(new Event(CLUB_JOINED));
    } catch {
      setFailed('אין חיבור לשרת. נסו שוב.');
    } finally {
      setBusy(false);
    }
  }

  const field = (
    k: 'name' | 'phone' | 'email',
    label: string,
    type: string,
    autoComplete: string,
    ref?: React.Ref<HTMLInputElement>,
    required = true,
  ) => (
    <label className="block">
      <span className="block" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}>
        {label}
      </span>
      <input
        ref={ref}
        type={type}
        value={lead[k]}
        onChange={(e) => set(k, e.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={errors[k] ? 'true' : undefined}
        aria-describedby={errors[k] ? `club-err-${k}` : undefined}
        className="mt-1.5 w-full px-3.5"
        style={{
          height: 46,
          fontSize: 'var(--fs-base)',
          borderRadius: 'var(--radius)',
          border: `1px solid ${errors[k] ? 'var(--sale)' : 'var(--line-strong)'}`,
          background: '#FFFFFF',
          color: 'var(--ink)',
        }}
      />
      {errors[k] && (
        <span
          id={`club-err-${k}`}
          className="mt-1 block"
          style={{ fontSize: 'var(--fs-2xs)', color: 'var(--sale)' }}
        >
          {errors[k]}
        </span>
      )}
    </label>
  );

  const selectStyle: React.CSSProperties = {
    height: 44,
    fontSize: 'var(--fs-base)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--line-strong)',
    background: '#FFFFFF',
    color: 'var(--ink)',
  };
  const pill = (
    <span
      className="inline-block"
      style={{
        border: '1.5px solid var(--ink)',
        borderRadius: 50,
        padding: '3px 14px',
        fontSize: 'var(--fs-2xs)',
        fontWeight: 700,
        color: 'var(--ink)',
      }}
    >
      מועדון מִקְרָא
    </span>
  );
  // ניצוץ מצויר - אותה שכבת אופי כמו במיילים
  const spark = (size: number, style: React.CSSProperties) => (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', ...style }}>
      <path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" fill="var(--ink)" />
    </svg>
  );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 118, background: 'rgb(20 18 12 / .55)' }}
      onClick={(e) => e.target === e.currentTarget && dismiss()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="club-title"
        className="club-pop relative w-full max-w-[400px] text-center"
        style={{
          // כחלחל (עמית, 23.11.2026), ברקע רציף אחד ולא בפסים - כמו במיילים
          background: 'radial-gradient(120% 70% at 50% 0%, #F1F8FD 0%, #D5EBF8 52%, #BCDDF1 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #FFFFFF',
          boxShadow: '0 24px 60px rgb(20 18 12 / .35), inset 0 1px 0 #FFFFFF',
          padding: '0 1.5rem 1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="סגירה"
          className="absolute"
          style={{
            top: 10,
            left: 10,
            zIndex: 2,
            width: 34,
            height: 34,
            borderRadius: 50,
            background: 'rgb(255 255 255 / .7)',
            fontSize: 'var(--fs-lg)',
            lineHeight: 1,
            color: 'var(--ink-2)',
          }}
        >
          ×
        </button>

        {code ? (
          <div style={{ paddingTop: '2.25rem' }}>
            {pill}
            <h2 id="club-title" className="display mt-3" style={{ fontSize: 'var(--ds-3)' }}>
              הקוד שלך מוכן
            </h2>
            <p className="mt-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
              מקלידים אותו בעגלה. {PROMO.percent}% הנחה על הפריטים, בהזמנה אחת לכל לקוח.
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(code).then(
                  () => setCopied(true),
                  () => setCopied(false),
                );
              }}
              className="mt-4 w-full"
              style={{
                border: '2px dashed var(--ink)',
                borderRadius: 'var(--radius)',
                padding: '.85rem',
                fontSize: 'var(--fs-lg)',
                fontWeight: 800,
                letterSpacing: '.18em',
                color: 'var(--ink)',
                background: '#FFFFFF',
              }}
            >
              <span dir="ltr">{code}</span>
            </button>
            <p className="mt-1.5" style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-2)' }} aria-live="polite">
              {copied ? 'הועתק' : 'לחצו כדי להעתיק'}
            </p>

            <div className="mt-4 text-start" style={{ borderTop: '1px solid rgb(59 36 24 / .15)', paddingTop: '1rem' }}>
              {bdayState === 'saved' ? (
                <p className="text-center" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink)' }} aria-live="polite">
                  נשמר, תודה.{bday.d && bday.m ? ' ביום ההולדת תקבלו מאיתנו מתנה קטנה.' : ''}
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink)', fontWeight: 700 }}>עוד שני פרטים, לא חובה</p>
                  <label className="mt-2 block">
                    <span className="block" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}>
                      שם פרטי
                    </span>
                    <input
                      type="text"
                      value={lead.name}
                      onChange={(e) => set('name', e.target.value)}
                      autoComplete="given-name"
                      className="mt-1 w-full px-3"
                      style={selectStyle}
                    />
                  </label>
                  <span className="mt-3 block" style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}>
                    יום הולדת - ביום עצמו שולחים מתנה קטנה
                  </span>
                  <div className="mt-1 flex gap-2">
                    <select
                      aria-label="יום"
                      value={bday.d}
                      onChange={(e) => setBday((b) => ({ ...b, d: e.target.value }))}
                      className="flex-1 px-2"
                      style={selectStyle}
                    >
                      <option value="">יום</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="חודש"
                      value={bday.m}
                      onChange={(e) => setBday((b) => ({ ...b, m: e.target.value }))}
                      className="flex-1 px-2"
                      style={selectStyle}
                    >
                      <option value="">חודש</option>
                      {['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'].map(
                        (m, i) => (
                          <option key={m} value={i + 1}>
                            {m}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={saveBirthday}
                    disabled={bdayState === 'busy' || (!(bday.d && bday.m) && lead.name.trim().length < 2)}
                    className="btn mt-3 w-full"
                    style={{ height: 44, background: '#FFFFFF' }}
                  >
                    שמירה
                  </button>
                  {bdayState === 'error' && (
                    <p className="mt-1" style={{ fontSize: 'var(--fs-2xs)', color: 'var(--sale)' }} aria-live="polite">
                      לא נשמר. נסו שוב.
                    </p>
                  )}
                </>
              )}
            </div>

            <button type="button" onClick={dismiss} className="btn btn-dark mt-4 w-full">
              חזרה לאתר
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            {/* שני תכשיטים אמיתיים, חתוכים, יורדים מראש הכרטיס - שבירת הגריד מהסקיל */}
            <div aria-hidden="true" className="relative" style={{ height: 158, margin: '0 -1.5rem' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/club/kachotam.webp"
                alt=""
                width={115}
                height={158}
                style={{ position: 'absolute', top: 0, right: '17%', height: 158, width: 'auto' }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/club/shiviti.webp"
                alt=""
                width={92}
                height={148}
                style={{ position: 'absolute', top: -14, left: '21%', height: 148, width: 'auto' }}
              />
              {spark(18, { top: 40, right: '7%' })}
              {spark(11, { top: 104, left: '9%' })}
              {spark(9, { top: 22, left: '50%' })}
            </div>

            {pill}
            <h2 id="club-title" className="display mt-1" style={{ lineHeight: 1.05 }}>
              <span className="block" style={{ fontSize: 'clamp(64px, 18vw, 82px)' }}>
                <span dir="ltr">{PROMO.percent}%</span>
              </span>
              <span className="block" style={{ fontSize: 'var(--ds-4, 1.6rem)' }}>
                הנחה על{' '}
                <span style={{ background: 'linear-gradient(transparent 52%, #E6CFAE 52%)', padding: '0 .15em' }}>
                  כל האתר
                </span>
              </span>
            </h2>
            <p className="mt-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
              משאירים אימייל, והקוד מופיע מיד כאן על המסך.
            </p>

            <div className="mt-4 text-start">{field('email', 'אימייל', 'email', 'email', firstField)}</div>

            {/* הסכמה מפורשת, לא מסומנת מראש. סעיף 30א לחוק התקשורת */}
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-start">
              <input
                type="checkbox"
                checked={lead.consent}
                onChange={(e) => set('consent', e.target.checked)}
                aria-invalid={errors.consent ? 'true' : undefined}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-2)', lineHeight: 1.6 }}>
                אני מאשר/ת לקבל הודעות פרסומיות באימייל. אפשר להפסיק בכל רגע.
                {errors.consent && (
                  <span className="block" style={{ color: 'var(--sale)' }}>
                    {errors.consent}
                  </span>
                )}
              </span>
            </label>

            {failed && (
              <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--sale)' }} role="alert">
                {failed}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn btn-dark mt-4 w-full">
              {busy ? 'רגע…' : 'לקבלת הקוד'}
            </button>
            <p className="mt-2" style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-2)' }}>
              הזמנה אחת לכל לקוח · על כל האתר
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-1 w-full"
              style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)', padding: '.5rem' }}
            >
              לא תודה
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
