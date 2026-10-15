import { BLESSINGS, isVisibleBlessing, type BlessingId } from './blessings';
import {
  PRODUCTS,
  blessingInStock,
  uniqueDesigns,
  type Audience,
  type CategoryId,
  type Product,
} from './catalog';

/* ============================================================
   "איזו ברכה מתאימה?" - שלוש שאלות, ברכה אחת.

   הכלל פשוט בכוונה: מי שמקבל את המתנה קובע את הברכה, והרגע
   משנה אותה רק במקרים מעטים. כך אפשר להסביר ללקוח במשפט אחד
   למה יצאה לו דווקא הברכה הזו.
   ============================================================ */

export type Who = 'mom' | 'man' | 'journey' | 'start' | 'self';
export type Moment = 'birthday' | 'wedding' | 'birth' | 'holiday' | 'none';
export type Kind = 'necklaces' | 'bracelets' | 'any';

export type Answers = { who: Who; moment: Moment; kind: Kind };

export type Option<T extends string> = { value: T; label: string; hint?: string };

export const WHO_OPTIONS: Option<Who>[] = [
  { value: 'mom', label: 'לאמא, לבת זוג או לאישה' },
  { value: 'man', label: 'לגבר', hint: 'בן זוג, אבא, בן' },
  { value: 'journey', label: 'למישהו שיוצא לדרך', hint: 'צבא, טיול, נהג חדש' },
  { value: 'start', label: 'למישהו שמתחיל משהו', hint: 'עסק, עבודה חדשה, בית חדש' },
  { value: 'self', label: 'לעצמי' },
];

export const MOMENT_OPTIONS: Option<Moment>[] = [
  { value: 'birthday', label: 'יום הולדת' },
  { value: 'wedding', label: 'חתונה או יום נישואין' },
  { value: 'birth', label: 'לידה או ברית' },
  { value: 'holiday', label: 'חג' },
  { value: 'none', label: 'בלי סיבה מיוחדת' },
];

export const KIND_OPTIONS: Option<Kind>[] = [
  { value: 'necklaces', label: 'שרשרת' },
  { value: 'bracelets', label: 'צמיד' },
  { value: 'any', label: 'לא משנה' },
];

/** הברכה הכללית - מתאימה כמעט לכל רגע, ויושבת על כל דגם */
const GENERAL: BlessingId = 'bracha';

/**
 * בוחר ברכה לפי התשובות. פונקציה טהורה - אותן תשובות, אותה ברכה.
 *
 * הסדר:
 * 1. לידה או ברית - ברכת התינוק, ואם היא מוסתרת (כרגע כן) הברכה הכללית.
 * 2. לאמא או לאישה - אשת חיל, בכל רגע.
 * 3. יוצא לדרך - שמירה. מתחיל משהו - פרנסה.
 * 4. לגבר - בחתונה הברכה הכללית, בחג פרנסה (שנה טובה), ובשאר שמירה.
 * 5. לעצמי - הברכה הכללית.
 */
function pickBlessing({ who, moment }: Answers): BlessingId {
  if (moment === 'birth') return isVisibleBlessing('tinok') ? 'tinok' : GENERAL;
  switch (who) {
    case 'mom':
      return 'eshet-chayil';
    case 'journey':
      return 'shmira';
    case 'start':
      return 'parnasa';
    case 'man':
      if (moment === 'wedding') return GENERAL;
      if (moment === 'holiday') return 'parnasa';
      return 'shmira';
    case 'self':
    default:
      return GENERAL;
  }
}

/** משפט אחד, בשפה פשוטה: למה דווקא הברכה הזו */
function reasonFor(id: BlessingId, { who, moment }: Answers): string {
  if (moment === 'birth' && id === GENERAL) {
    return 'ברכה לבריאות, לשפע ולמשפחה - מתאימה לתינוק שנולד ולהורים שלו.';
  }
  switch (id) {
    case 'eshet-chayil':
      return moment === 'wedding'
        ? 'מילים של תודה והערכה לאישה שבונה איתכם בית - מתאים במיוחד לחתונה וליום נישואין.'
        : 'מילים של תודה והערכה לאישה שאתם אוהבים. מתאים לאמא, לבת זוג ולסבתא.';
    case 'shmira':
      return who === 'journey'
        ? 'ברכה שמבקשת שמירה בדרך. מתאים למי שמתגייס, נוסע רחוק או מתחיל לנהוג.'
        : 'ברכה שמבקשת שמירה והגנה, בכל מקום. מתנה שגבר יכול לענוד כל יום.';
    case 'parnasa':
      return who === 'start'
        ? 'ברכה להצלחה בעבודה ולפרנסה טובה. מתאים לפתיחת עסק, לעבודה חדשה ולבית חדש.'
        : 'ברכה להצלחה ולשנה טובה. מתאים לחג ולמי שעובד קשה.';
    case 'tinok':
      return 'ברכה לתינוק שנולד, לבריאות ולשמירה.';
    case 'bracha':
    default:
      if (who === 'self') return 'ברכה לבריאות, לשפע ולשלווה. מתאים כשרוצים ברכה לכל דבר.';
      if (moment === 'wedding') return 'ברכה לבית חדש, לבריאות ולמשפחה - מתאים לחתונה וליום נישואין.';
      return 'ברכה לבריאות, לשפע ולמשפחה. מתאים כמעט לכל רגע ולכל אחד.';
  }
}

function audienceFor(who: Who): Audience | 'any' {
  if (who === 'mom') return 'women';
  if (who === 'man') return 'men';
  return 'any';
}

/**
 * דגמים שנושאים את הברכה, במלאי בברכה הזו, ומתאימים לקהל ולסוג.
 *
 * אם אין מספיק - קודם מוותרים על הסוג (שרשרת/צמיד), ואחר כך על הקהל.
 * הברכה והמלאי לא נפתחים אף פעם: לא ממליצים על מה שאי אפשר לקנות.
 */
function pickProducts(id: BlessingId, audience: Audience | 'any', kind: Kind, max = 3) {
  const base = uniqueDesigns(
    PRODUCTS.filter((p) => p.blessings.includes(id) && blessingInStock(p, id)),
  );

  const fitsAudience = (p: Product) =>
    audience === 'any' || p.audience === audience || p.audience === 'unisex';
  const fitsKind = (p: Product) => kind === 'any' || p.category === (kind as CategoryId);

  // דגם שבו הברכה היא ברירת המחדל קודם, ואחריו המומלצים
  const rank = (p: Product) => (p.blessings[0] === id ? 0 : 2) + (p.featured ? 0 : 1);
  const sorted = (list: Product[]) =>
    [...list].sort((a, b) => rank(a) - rank(b) || a.price - b.price);

  const strict = base.filter((p) => fitsAudience(p) && fitsKind(p));
  if (strict.length >= 2) return { products: sorted(strict).slice(0, max), relaxed: false };

  const noKind = base.filter(fitsAudience);
  const pool = noKind.length >= 2 ? noKind : base;
  // מה שתואם במלואו נשאר ראשון, וההשלמה אחריו
  const rest = sorted(pool.filter((p) => !strict.includes(p)));
  const products = [...sorted(strict), ...rest].slice(0, max);
  return { products, relaxed: products.some((p) => !strict.includes(p)) };
}

export type MatchResult = {
  blessing: BlessingId;
  reason: string;
  products: Product[];
  /** חלק מהדגמים לא תואמים את הסוג או הקהל שנבחרו - כדי שהמסך יגיד את זה */
  relaxed: boolean;
};

export function matchBlessing(answers: Answers): MatchResult {
  let blessing = pickBlessing(answers);
  // רק ברכה שמוצגת באתר. אם משהו הוסתר - חוזרים לכללית, ואם גם היא לא - לראשונה
  if (!BLESSINGS.some((b) => b.id === blessing)) {
    blessing = BLESSINGS.some((b) => b.id === GENERAL) ? GENERAL : BLESSINGS[0].id;
  }
  const { products, relaxed } = pickProducts(blessing, audienceFor(answers.who), answers.kind);
  return { blessing, reason: reasonFor(blessing, answers), products, relaxed };
}
