import type { Metadata } from 'next';
import GiftCardForm from './GiftCardForm';
import { GIFT_VALID_YEARS } from '@/lib/giftcard';

export const metadata: Metadata = {
  title: 'כרטיס מתנה',
  description: 'כרטיס מתנה למִקְרָא, במייל: מי שמקבל בוחר בעצמו את התכשיט ואת הברכה. ₪300, ₪500 או ₪750.',
  alternates: { canonical: '/gift-card' },
};

/**
 * כרטיס מתנה - למי שלא בטוח איזו ברכה לבחור (lib/giftcard.ts).
 */
export default function GiftCardPage() {
  return (
    <section className="pb-28 pt-32 md:pt-40">
      <div className="shell max-w-3xl">
        <p className="eyebrow">כרטיס מתנה</p>
        <h1 className="display t-1 mt-2">הם בוחרים את הברכה.</h1>
        <p className="lede mt-4 max-w-xl">
          לא בטוחים איזו ברכה ואיזה תכשיט? שולחים כרטיס מתנה במייל, ומי שמקבל בוחר בעצמו. אפשר לבחור תאריך, ולכתוב כמה
          מילים משלכם.
        </p>
        <GiftCardForm />
        <ul className="mt-10 grid gap-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
          <li>· הכרטיס מגיע במייל, עם קוד שמקלידים בקופה.</li>
          <li>· בתוקף {GIFT_VALID_YEARS} שנים. אם התכשיט עולה פחות - היתרה נשארת לפעם הבאה.</li>
          <li>· אפשר לשלם בכרטיס אשראי, bit, Apple Pay או Google Pay.</li>
        </ul>
      </div>
    </section>
  );
}
