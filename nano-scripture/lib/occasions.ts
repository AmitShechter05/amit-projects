import { POLICY } from './policy';
import { addBusinessDays, isBusinessDay } from './delivery';

/**
 * חגים ומועדים שקונים בהם מתנה, ועד מתי להזמין כדי שהמתנה תגיע בזמן.
 *
 * התאריכים מ-hebcal, לוח ישראל:
 *   https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=off&i=on&year=2026
 *   (וכך גם year=2027, year=2028)
 * יום המשפחה (ל׳ בשבט) מופיע שם כ-"Family Day", ונבדק גם מול הממיר:
 *   https://www.hebcal.com/converter?cfg=json&hy=5787&hm=Shvat&hd=30&h2g=1  (וגם hy=5788)
 *
 * `date` הוא היום שבו המתנה צריכה כבר להיות ביד: בחנוכה - היום של הנר
 * הראשון (מדליקים בערב), בפסח, שבועות וראש השנה - הערב, ובשאר - היום עצמו.
 *
 * **לעדכן פעם בשנה, יחד עם רשימת החגים ב-lib/delivery.ts.** כשהרשימה
 * נגמרת, הפונקציה פשוט מחזירה null ושום דבר לא מוצג.
 */
export type Occasion = {
  id: string;
  /** השם בעברית פשוטה. בשורה הוא בא אחרי ל-: "שיגיע לחנוכה" */
  name: string;
  /** YYYY-MM-DD, לפי לוח ישראל */
  date: string;
};

export const OCCASIONS: readonly Occasion[] = [
  // 2026
  { id: 'family-day-2026', name: 'יום המשפחה', date: '2026-02-17' },
  { id: 'purim-2026', name: 'פורים', date: '2026-03-03' },
  { id: 'pesach-2026', name: 'פסח', date: '2026-04-01' },
  { id: 'shavuot-2026', name: 'שבועות', date: '2026-05-21' },
  { id: 'tu-beav-2026', name: 'ט״ו באב', date: '2026-07-29' },
  { id: 'rosh-hashana-2026', name: 'ראש השנה', date: '2026-09-11' },
  { id: 'chanukah-2026', name: 'חנוכה', date: '2026-12-04' },
  // 2027
  { id: 'family-day-2027', name: 'יום המשפחה', date: '2027-02-07' },
  { id: 'purim-2027', name: 'פורים', date: '2027-03-23' },
  { id: 'pesach-2027', name: 'פסח', date: '2027-04-21' },
  { id: 'shavuot-2027', name: 'שבועות', date: '2027-06-10' },
  { id: 'tu-beav-2027', name: 'ט״ו באב', date: '2027-08-18' },
  { id: 'rosh-hashana-2027', name: 'ראש השנה', date: '2027-10-01' },
  { id: 'chanukah-2027', name: 'חנוכה', date: '2027-12-24' },
  // 2028
  { id: 'family-day-2028', name: 'יום המשפחה', date: '2028-02-27' },
  { id: 'purim-2028', name: 'פורים', date: '2028-03-12' },
  { id: 'pesach-2028', name: 'פסח', date: '2028-04-10' },
  { id: 'shavuot-2028', name: 'שבועות', date: '2028-05-30' },
  { id: 'tu-beav-2028', name: 'ט״ו באב', date: '2028-08-07' },
  { id: 'rosh-hashana-2028', name: 'ראש השנה', date: '2028-09-20' },
  { id: 'chanukah-2028', name: 'חנוכה', date: '2028-12-12' },
];

/** כמה ימים קדימה מראים את השורה. יותר מזה - מוקדם מדי לדבר על זה */
const WINDOW_DAYS = 21;

const TZ = 'Asia/Jerusalem';
const DAY_MS = 86_400_000;
const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/**
 * השעה בישראל, כ-Date "מקומי".
 *
 * החישובים ב-lib/delivery.ts קוראים getDay/getHours, כלומר את אזור הזמן
 * של המכונה. השרת בוורסל רץ ב-UTC, ולקוח בחו"ל רואה שעון אחר. לכן
 * מתרגמים קודם לשעון הקיר בישראל, ומעבירים לחישוב את זה.
 */
function israelWallClock(at: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
}

/** משעון קיר בישראל חזרה לרגע אמיתי (מתחשב בשעון קיץ) */
function fromIsraelWallClock(wall: Date) {
  let guess = wall.getTime();
  for (let i = 0; i < 2; i++) {
    const offset = israelWallClock(new Date(guess)).getTime() - guess;
    guess = wall.getTime() - offset;
  }
  return new Date(guess);
}

function parseDay(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayDiff(a: Date, b: Date) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS);
}

/**
 * יום העסקים האחרון שבו הזמנה עד 18:00 עוד מגיעה לפני המועד, גם אם
 * המשלוח לוקח את המקסימום (4 ימי עסקים). "לפני" = לכל המאוחר יום לפני.
 */
function lastDispatchDay(occasionDay: Date) {
  const d = new Date(occasionDay);
  for (let i = 0; i < 40; i++) {
    d.setDate(d.getDate() - 1);
    if (isBusinessDay(d) && addBusinessDays(d, POLICY.deliveryMaxDays) < occasionDay) {
      return new Date(d);
    }
  }
  return null;
}

export type OccasionDeadline = {
  occasion: Occasion;
  /** הרגע האחרון להזמנה (18:00 שעון ישראל), כרגע אמיתי */
  lastOrderDay: Date;
  /** "רוצים שיגיע לחנוכה? להזמין עד יום חמישי 3.12, 18:00" */
  label: string;
};

/**
 * המועד הקרוב שעוד אפשר להספיק אליו, אם ההזמנה האחרונה בעוד 21 יום
 * לכל היותר. אחרת null.
 */
export function nextOccasionDeadline(now: Date = new Date()): OccasionDeadline | null {
  const wallNow = israelWallClock(now);
  const today = startOfDay(wallNow);

  for (const occasion of OCCASIONS) {
    const occasionDay = parseDay(occasion.date);
    if (occasionDay <= today) continue;

    const day = lastDispatchDay(occasionDay);
    if (!day) continue;
    const deadline = new Date(day);
    deadline.setHours(POLICY.orderCutoffHour, 0, 0, 0);
    // כבר עבר - אולי המועד הבא עוד אפשרי
    if (deadline <= wallNow) continue;
    // המועד הקרוב רחוק מדי; כל מה שאחריו רחוק עוד יותר
    if (dayDiff(day, today) > WINDOW_DAYS) return null;

    const diff = dayDiff(day, today);
    const when =
      diff === 0
        ? 'היום'
        : diff === 1
          ? 'מחר'
          : `יום ${WEEKDAYS[day.getDay()]} ${day.getDate()}.${day.getMonth() + 1}`;

    return {
      occasion,
      lastOrderDay: fromIsraelWallClock(deadline),
      label: `רוצים שיגיע ל${occasion.name}? להזמין עד ${when}, ${POLICY.orderCutoffHour}:00`,
    };
  }
  return null;
}
