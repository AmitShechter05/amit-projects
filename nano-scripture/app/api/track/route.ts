import { NextResponse, type NextRequest } from 'next/server';
import { BROWSER_EVENTS, sendMetaFunnelEvent, type BrowserEvent } from '@/lib/serverConversions';

/**
 * הדפדפן מודיע כאן על הוספה לעגלה / תחילת קופה / מילוי פרטים, והשרת
 * מעביר למטא (lib/serverConversions.ts, sendMetaFunnelEvent).
 *
 * הגוף מהדפדפן אינו אמין, ולכן נלקחים ממנו רק שם מהרשימה, מזהה, וכמה
 * שדות מספריים/קצרים. הזיהוי (IP, דפדפן, עוגיות הפיקסל) - מהבקשה עצמה.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const name = body.name as BrowserEvent;
  const id = typeof body.id === 'string' ? body.id.slice(0, 64) : '';
  if (!BROWSER_EVENTS.includes(name) || !id) return new NextResponse(null, { status: 400 });

  const d = (body.data ?? {}) as Record<string, unknown>;
  const value = Number(d.value);
  const ids = Array.isArray(d.content_ids) ? d.content_ids.filter((x) => typeof x === 'string').slice(0, 20).map((x) => String(x).slice(0, 40)) : [];
  const contents = Array.isArray(d.contents)
    ? d.contents.slice(0, 20).map((c) => {
        const r = (c ?? {}) as Record<string, unknown>;
        return { id: String(r.id ?? '').slice(0, 40), quantity: Math.min(Math.max(Number(r.quantity) || 1, 1), 99), item_price: Number(r.item_price) || 0 };
      })
    : [];
  const custom: Record<string, unknown> = {
    currency: 'ILS',
    value: Number.isFinite(value) && value >= 0 && value < 100_000 ? value : 0,
    content_type: 'product',
    content_ids: ids,
    contents,
  };
  if (typeof d.num_items === 'number') custom.num_items = Math.min(Math.max(d.num_items, 0), 99);

  const ref = req.headers.get('referer') ?? '';
  const url = /^https:\/\/(www\.)?mikra\.shop\//.test(ref) ? ref.split('?')[0] : 'https://mikra.shop/';

  try {
    await sendMetaFunnelEvent({
      name,
      id,
      url,
      ip: (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined,
      ua: req.headers.get('user-agent') ?? undefined,
      fbp: req.cookies.get('_fbp')?.value,
      fbc: req.cookies.get('_fbc')?.value,
      custom,
    });
  } catch (e) {
    console.error('[track]', String(e));
  }
  return new NextResponse(null, { status: 204 });
}
