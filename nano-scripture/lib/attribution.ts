/**
 * מאיפה הגיע הלקוח - נשמר בכניסה, ונכנס להזמנה בווקומרס.
 *
 * ------------------------------------------------------------------
 * למה (עמית, 18.11.2026): במודעות יש UTM, ובווקומרס ההזמנה הראתה רק
 * "storefront". ה-UTM נמצא בכתובת של העמוד הראשון בלבד; עד הקופה הלקוח
 * כבר עבר כמה עמודים והפרמטרים נעלמו. לכן שומרים אותם בעוגייה בכניסה,
 * והשרת קורא אותה כשנוצרת ההזמנה (app/api/checkout/route.ts).
 * ------------------------------------------------------------------
 *
 * המקור האחרון גובר (last touch): כניסה חדשה עם UTM, fbclid, gclid או
 * הפניה מאתר אחר מחליפה את מה שנשמר. כניסה ישירה לא מוחקת מקור קודם -
 * מי שראה מודעה וחזר אחר כך בהקלדה עדיין "שייך" למודעה.
 *
 * מי שסירב לעוגיות - לא נשמר כלום.
 */
import { hasConsent } from './consent';

export const SRC_COOKIE = 'mikra_src';
const DAYS = 30;

export type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  /** ההפניה החיצונית, אם הייתה */
  ref?: string;
  /** העמוד הראשון של הביקור, בלי פרמטרים */
  landing?: string;
  /** 'utm' | 'referral' | 'typein' - כמו בייחוס של ווקומרס */
  type?: string;
  at?: string;
};

const clip = (v: string | null | undefined, n = 120) => (v ? v.slice(0, n) : undefined);

function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function writeCookie(name: string, value: string, days: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${days * 86400}; Path=/; SameSite=Lax; Secure`;
}

/** נקרא פעם אחת בטעינה הראשונה של כל ביקור */
export function captureAttribution() {
  if (typeof window === 'undefined' || !hasConsent('analytics')) return;
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams;
    const fbclid = q.get('fbclid');
    const gclid = q.get('gclid') || q.get('gbraid') || q.get('wbraid');

    let ref: string | undefined;
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      if (r && r.hostname !== url.hostname && !/(^|\.)mikra\.shop$/.test(r.hostname)) ref = r.hostname;
    } catch {
      /* הפניה שבורה */
    }

    // עוגיית _fbc בשביל הדיווח מהשרת. הפיקסל יוצר אותה בעצמו, אבל כשהוא
    // נחסם (ספארי, חוסם פרסומות) - הקליק על המודעה היה הולך לאיבוד
    if (fbclid && !readCookie('_fbc')) writeCookie('_fbc', `fb.1.${Date.now()}.${fbclid}`, 90);

    const hasUtm = ['utm_source', 'utm_medium', 'utm_campaign'].some((k) => q.get(k));
    let a: Attribution | null = null;
    if (hasUtm) {
      a = {
        type: 'utm',
        source: clip(q.get('utm_source')),
        medium: clip(q.get('utm_medium')),
        campaign: clip(q.get('utm_campaign')),
        content: clip(q.get('utm_content')),
        term: clip(q.get('utm_term')),
      };
    } else if (fbclid) {
      a = { type: 'utm', source: 'meta', medium: 'click (fbclid)' };
    } else if (gclid) {
      a = { type: 'utm', source: 'google', medium: 'cpc (gclid)' };
    } else if (ref) {
      a = { type: 'referral', source: ref, medium: 'referral' };
    } else if (!readCookie(SRC_COOKIE)) {
      a = { type: 'typein', source: '(direct)', medium: '(none)' };
    }
    if (!a) return;

    a.ref = ref;
    a.landing = clip(url.pathname, 200);
    a.at = new Date().toISOString();
    for (const k of Object.keys(a) as (keyof Attribution)[]) if (a[k] === undefined) delete a[k];
    writeCookie(SRC_COOKIE, JSON.stringify(a), DAYS);
  } catch {
    /* עוגיות חסומות - אין ייחוס, האתר עובד כרגיל */
  }
}

/** בצד השרת: הערך הגולמי של העוגייה -> אובייקט נקי */
export function parseAttribution(raw: string | undefined): Attribution | undefined {
  if (!raw) return undefined;
  try {
    // Next מפענח את ערך העוגייה בעצמו, אבל לא בכל גרסה - לכן שני הניסיונות
    let v: Record<string, unknown>;
    try {
      v = JSON.parse(raw);
    } catch {
      v = JSON.parse(decodeURIComponent(raw));
    }
    const out: Attribution = {};
    for (const k of ['source', 'medium', 'campaign', 'content', 'term', 'ref', 'landing', 'type', 'at'] as const) {
      if (typeof v[k] === 'string' && v[k]) out[k] = (v[k] as string).slice(0, 200);
    }
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}
