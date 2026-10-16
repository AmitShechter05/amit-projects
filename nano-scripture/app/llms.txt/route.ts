import { BRAND } from '@/lib/brand';
import { PRODUCTS, CATEGORIES, ACTIVE_CATEGORIES, productInStock } from '@/lib/catalog';
import { BLESSINGS } from '@/lib/blessings';
import { allGuides } from '@/lib/guides';
import { POLICY } from '@/lib/policy';
import { COMPANY } from '@/lib/company';
import { SITE_URL } from '@/lib/site';
import { syncPrices } from '@/lib/livePrices';
import { distinctName } from '@/lib/seo';
import { GIFT_AMOUNTS, GIFT_VALID_YEARS } from '@/lib/giftcard';

export const revalidate = 300;

/**
 * /llms.txt - האתר בקצרה, בשביל ChatGPT, Claude, Perplexity וחיפוש עם AI
 * (llmstxt.org). נבנה מהקטלוג, מהמדיניות ומהמחירים בווקומרס - שום מספר לא
 * נכתב כאן ביד, כך שהקובץ לא מתיישן כשמשהו משתנה באתר.
 */
export async function GET() {
  await syncPrices();
  const u = (path: string) => `${SITE_URL}${path}`;
  const lines: string[] = [];
  const out = (s = '') => lines.push(s);

  out(`# ${BRAND.plain} (${BRAND.nameLatin})`);
  out();
  out(`> ${BRAND.tagline} חנות תכשיטים ישראלית: שרשראות וצמידים עם שבב זכוכית של 5 מ״מ, ועליו חרוטה ברכה שלמה מהתנ״ך. בוחרים ברכה, וקוראים את כולה באתר לפני שקונים.`);
  out();
  out(`- משלוח מבוטח ${POLICY.deliveryMinDays}-${POLICY.deliveryMaxDays} ימי עסקים לכל הארץ${POLICY.shippingFlat ? ` (₪${POLICY.shippingFlat}${POLICY.freeShippingOver ? `, חינם מעל ₪${POLICY.freeShippingOver}` : ''})` : ''}, או איסוף עצמי ממודיעין בתיאום.`);
  out(`- החזרה תוך ${POLICY.returnDays} יום. אחריות ${POLICY.warrantyMonths} חודשים על גוף התכשיט. עד ${POLICY.maxInstallments} תשלומים.`);
  out(`- יצירת קשר: ${[COMPANY.phone, COMPANY.email].filter(Boolean).join(' · ')} · ${COMPANY.address}`);
  out();

  out('## הברכות');
  out();
  for (const b of BLESSINGS) {
    out(`- [${b.plain}](${u(`/blessings/${b.id}`)}): ${b.sources}. ${b.forWhom}.`);
  }
  out(`- [איזו ברכה מתאימה?](${u('/match')}): שלוש שאלות קצרות, והמלצה על ברכה ותכשיטים.`);
  out();

  for (const cat of ACTIVE_CATEGORIES) {
    out(`## ${CATEGORIES[cat].title}`);
    out();
    for (const p of PRODUCTS.filter((x) => x.category === cat)) {
      const blessings = p.blessings
        .map((id) => BLESSINGS.find((b) => b.id === id)?.plain)
        .filter(Boolean)
        .join(', ');
      const stock = productInStock(p) ? '' : ' · אזל מהמלאי';
      out(`- [${distinctName(p)}](${u(`/products/${p.slug}`)}): ₪${p.price}${stock}. ${p.short} ברכות: ${blessings}.`);
    }
    out();
  }

  out('## מדריכי מתנה');
  out();
  for (const g of allGuides()) {
    out(`- [${g.title}](${u(`/guides/${g.slug}`)}): ${g.metaDescription}`);
  }
  out();

  out('## עוד');
  out();
  out(`- [כרטיס מתנה](${u('/gift-card')}): ₪${GIFT_AMOUNTS.join(' / ₪')}, במייל, בתוקף ${GIFT_VALID_YEARS} שנים.`);
  out(`- [איך זה עובד](${u('/craft')}): איך הברכה נחרטת על השבב.`);
  out(`- [משלוחים והחזרות](${u('/legal/shipping-returns')})`);
  out(`- [יצירת קשר](${u('/contact')})`);
  out(`- [כל התכשיטים](${u('/catalog')})`);
  out();

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
