import 'server-only';
import { wcGet } from './wc';
import { PROMO, isPromoCode, normalizeCode, registerCoupon, type CouponInfo } from './promo';

/**
 * בדיקת קוד הנחה מול ווקומרס.
 *
 * עד 16.10.2026 הקופה הכירה רק את קוד ההצטרפות. עכשיו כל קופון של
 * ווקומרס מתקבל: קוד אישי מזרימת החזרה (BACK10-...), קוד נטישה
 * (BRACHA-...) וכרטיס מתנה. נבדקים כאן הסוג, התפוגה, מספר השימושים
 * והכתובת שהקוד מוגבל אליה - ווקומרס יבדוק שוב ביצירת ההזמנה, אבל
 * הלקוח צריך לשמוע "הקוד פג" בעגלה ולא אחרי שמילא את כל הפרטים.
 *
 * קוד תקין נרשם (registerCoupon) כדי שהסכום שהשרת מחשב יהיה זה שבעגלה.
 */

type WcCoupon = {
  code: string;
  status?: string;
  discount_type: string;
  amount: string;
  date_expires_gmt: string | null;
  usage_count: number;
  usage_limit: number | null;
  email_restrictions: string[];
  minimum_amount?: string;
};

export type CouponCheck =
  | { ok: true; coupon: CouponInfo; personal: boolean }
  | { ok: false; error: string };

/** ווקומרס מאפשר * בהגבלת כתובת (למשל *@company.co.il) */
function emailAllowed(email: string, rules: string[]) {
  const e = email.trim().toLowerCase();
  return rules.some((r) => {
    const rx = new RegExp('^' + r.trim().toLowerCase().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    return rx.test(e);
  });
}

export async function checkCoupon(raw: string, email?: string): Promise<CouponCheck> {
  const code = normalizeCode(raw);
  if (!code) return { ok: false, error: 'לא הוזן קוד.' };
  if (isPromoCode(code)) {
    return { ok: true, coupon: { code: PROMO.code, type: 'percent', amount: PROMO.percent }, personal: false };
  }
  let list: WcCoupon[] = [];
  try {
    list = await wcGet<WcCoupon[]>('/coupons', { code: code.toLowerCase(), per_page: 5 });
  } catch (e) {
    console.error('coupon lookup failed', e);
    return { ok: false, error: 'לא הצלחנו לבדוק את הקוד כרגע. נסו שוב בעוד רגע.' };
  }
  const c = list.find((x) => normalizeCode(x.code) === code && (x.status ?? 'publish') === 'publish');
  if (!c) return { ok: false, error: 'הקוד לא מוכר. בדקו שהקלדתם נכון ונסו שוב.' };
  if (c.discount_type !== 'percent' && c.discount_type !== 'fixed_cart') {
    return { ok: false, error: 'את הקוד הזה אי אפשר להפעיל באתר. כתבו לנו ונעזור.' };
  }
  if (c.date_expires_gmt && new Date(c.date_expires_gmt + 'Z').getTime() < Date.now()) {
    return { ok: false, error: 'תוקף הקוד הסתיים.' };
  }
  if (c.usage_limit !== null && c.usage_limit > 0 && c.usage_count >= c.usage_limit) {
    return { ok: false, error: 'הקוד כבר נוצל.' };
  }
  const rules = (c.email_restrictions ?? []).filter(Boolean);
  if (email && rules.length && !emailAllowed(email, rules)) {
    return { ok: false, error: 'הקוד הזה אישי, ועובד רק עם כתובת המייל שאליה הוא נשלח.' };
  }
  const amount = Number(c.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'הקוד לא מוכר.' };
  const coupon: CouponInfo = { code, type: c.discount_type, amount };
  registerCoupon(coupon);
  return { ok: true, coupon, personal: rules.length > 0 };
}
