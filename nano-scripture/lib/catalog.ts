import { salePrice } from './promo';
import { POLICY, deliveryLine } from './policy';
import { wornFor, wornFocus } from './worn';
import type { BlessingId } from './blessings';

/* ============================================================
   הקטלוג האמיתי — מבוסס על ה־PI מ־YIYA Jewelry (JW-20260803-1).
   המק״טים, המידות, החומרים והעלויות הם כפי שהם בהזמנה.
   ============================================================ */

export type CategoryId = 'necklaces' | 'bracelets' | 'rings' | 'pins';
export type Material = 'silver925' | 'steel';
export type Finish = 'silver' | 'gold' | 'black' | 'retro';
export type Audience = 'women' | 'men' | 'unisex';
/** קבוצות הגיל של גוגל. לפיד בלבד */
export type AgeGroup = 'newborn' | 'infant' | 'toddler' | 'kids' | 'adult';

export const MATERIALS: Record<Material, { label: string; note: string }> = {
  silver925: {
    label: 'כסף 925',
    note: 'כסף 925 בציפוי בצבע זהב לבן, עם אבנים קטנות מסביב לשבב.',
  },
  steel: {
    label: 'פלדת אל־חלד',
    note: 'פלדת אל־חלד (נירוסטה) - לא מחלידה ולא משנה צבע.',
  },
};

export const FINISHES: Record<Finish, string> = {
  silver: 'כסף',
  gold: 'זהב',
  black: 'שחור',
  retro: 'כסף מושחר',
};

export type Category = {
  id: CategoryId;
  title: string;
  singular: string;
  /** צורת הסמיכות לפני חומר - "סיכת כסף", לא "סיכה כסף". חסר = כמו singular */
  construct?: string;
  subtitle: string;
  blurb: string;
};

export const CATEGORIES: Record<CategoryId, Category> = {
  necklaces: {
    id: 'necklaces',
    title: 'שרשראות',
    singular: 'שרשרת',
    subtitle: 'תליונים ומדליונים',
    blurb:
      'התליון יושב מתחת לצוואר. בכל שרשרת אפשר לשנות את האורך: לענוד אותה גבוה, או להסתיר אותה מתחת לחולצה.',
  },
  bracelets: {
    id: 'bracelets',
    title: 'צמידים',
    singular: 'צמיד',
    subtitle: 'צמידי שרשרת וצמידים קשיחים',
    blurb:
      'על היד רואים את השבב כל היום. הצמידים דקים ונוחים, עם סוגר בטוח ושרשרת הארכה, כדי שיתאימו לכל יד.',
  },
  rings: {
    id: 'rings',
    title: 'טבעות',
    singular: 'טבעת',
    subtitle: 'בקרוב',
    blurb: 'הטבעות הראשונות שלנו נמצאות עכשיו בייצור.',
  },
  pins: {
    id: 'pins',
    // הכותרת מדברת על מי שמקבל ולא על סוג הפריט. ה-slug נשאר pins
    // כי הוא כתובת חיה שיושבת ב-sitemap
    title: 'לתינוק',
    singular: 'סיכה',
    construct: 'סיכת',
    subtitle: 'לעגלה ולחדר התינוק',
    blurb:
      'סיכה שמחברים לעגלה, לשמיכה או לכיסא של התינוק. היא נשארת איתו בשנים שבהן הוא עוד לא יכול לענוד תכשיט, והברכה תמיד לידו.',
  },
};

export const CATEGORY_ORDER: CategoryId[] = ['necklaces', 'bracelets', 'pins', 'rings'];

export type Product = {
  /** מק״ט הספק — המזהה במלאי ובהזמנות */
  sku: string;
  slug: string;
  name: string;
  nameLatin: string;
  category: CategoryId;
  material: Material;
  finish: Finish;
  audience: Audience;
  /** למי הפריט מיועד לפי גיל. חסר = מבוגרים. לפיד של גוגל, שדורש זאת לתכשיטים */
  ageGroup?: AgeGroup;
  /**
   * מחיר לצרכן בשקלים, כולל מע״מ.
   *
   * המספר שכתוב כאן הוא גיבוי. המחיר שמוצג ונגבה הוא זה שבווקומרס:
   * `applyPrices` דורס אותו בזמן ריצה (ראו בסוף הרשימה ו-lib/livePrices.ts).
   */
  price: number;
  compareAt?: number;
  /** עלות ליחידה בדולר, מתוך ה־PI. פנימי — לא מוצג באתר. */
  cost?: number;
  image: string;
  short: string;
  story: string;
  specs: { label: string; value: string }[];
  /**
   * הברכות שאפשר לצרוב על הדגם, לפי קובץ ההזמנה הסופי של עמית
   * (mikra new order newww.xlsx, 17.9.2026, במספור של ה-PI: גרסה 1 תינוק,
   * 2 פרנסה, 3 הברכה שלך, 4 שמירה, 5 אשת חיל). הראשון ברשימה הוא ברירת
   * המחדל בבורר. הברכה שלך יושבת על כל דגם - 6 שבבים לכל אחד.
   */
  blessings: BlessingId[];
  /** הפסוק שממנו נגזר שם הדגם. מוצג לצד השם. */
  source?: { phrase: string; ref: string };
  /** צילומי הפריט בסביבה מסוגננת. כל אחד נכנס לגלריה כתצוגה נפרדת */
  scenes?: string[];
  badge?: string;
  featured?: boolean;
};

export const PRODUCTS: Product[] = [
  /* ---------- כסף 925 ---------- */
  {
    sku: 'YASNN004W',
    slug: 'toldot',
    scenes: ['/scene/toldot-wood.jpg', '/scene/toldot-dark.jpg', '/scene/toldot-3.jpg'],
    name: 'תּוֹלְדוֹת',
    nameLatin: 'TOLDOT',
    source: { phrase: 'אֵלֶּה תוֹלְדוֹת הַשָּׁמַיִם וְהָאָרֶץ', ref: 'בראשית ב׳, ד׳' },
    category: 'necklaces',
    material: 'silver925',
    finish: 'silver',
    audience: 'women',
    price: 749,
    cost: 31.9,
    image: '/products/YASNN004W.webp',
    blessings: ['bracha', 'eshet-chayil', 'shmira'],
    short: 'מדליון עץ החיים מכסף 925, עם השבב במרכז, בין הענפים',
    story:
      'התכשיט הגדול והמושקע ביותר שלנו. מדליון בקוטר 29.2 מ״מ עם עץ החיים, מכסף 925. במקום שבו הענפים נפגשים נמצא השבב, בתוך מסגרת של אבנים קטנות.',
    specs: [
      { label: 'קוטר המדליון', value: '29.2 מ״מ' },
      { label: 'מסגרת השבב', value: 'ריבוע עם אבנים קטנות, במרכז המדליון' },
      { label: 'אורך השרשרת', value: '42 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'כסף 925 בציפוי בצבע זהב לבן, מבריק' },
    ],
    featured: true,
  },
  {
    sku: 'YASNN010W',
    slug: 'tipat-or',
    scenes: ['/scene/tipat-or-sweater.jpg'],
    name: 'טִפַּת אוֹר',
    nameLatin: 'TIPAT OR',
    category: 'necklaces',
    material: 'silver925',
    finish: 'silver',
    audience: 'women',
    price: 549,
    cost: 16.5,
    image: '/products/YASNN010W.webp',
    blessings: ['bracha', 'eshet-chayil', 'parnasa'],
    short: 'שרשרת בצורת Y מכסף 925: סמל האינסוף, והשבב תלוי מתחתיו',
    story:
      'שרשרת בצורת Y. סמל האינסוף יושב מתחת לצוואר, וממנו יורדת שרשרת דקה עם השבב בקצה. כשהולכים התליון זז קצת, וזה חלק מהיופי שלו.',
    specs: [
      { label: 'מידות התליון', value: '20 × 6.3 מ״מ' },
      { label: 'מסגרת השבב', value: '8.4 מ״מ, עם אבנים קטנות' },
      { label: 'אורך השרשרת', value: '46 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'צורה', value: 'צורת Y - סמל האינסוף במרכז, והתליון יורד ממנו' },
      { label: 'מתכת', value: 'כסף 925 בציפוי בצבע זהב לבן, מבריק' },
    ],
    featured: true,
  },
  {
    sku: 'YASNB001W',
    slug: 'ahavat-olam',
    scenes: ['/scene/ahavat-olam-tray.jpg'],
    name: 'אַהֲבַת עוֹלָם',
    nameLatin: 'AHAVAT OLAM',
    source: { phrase: 'וְאַהֲבַת עוֹלָם אֲהַבְתִּיךְ', ref: 'ירמיהו ל״א, ב׳' },
    category: 'bracelets',
    material: 'silver925',
    finish: 'silver',
    audience: 'women',
    price: 549,
    cost: 15.4,
    image: '/products/YASNB001W.webp',
    blessings: ['bracha', 'eshet-chayil', 'parnasa'],
    short: 'צמיד עדין מכסף 925, עם סמל האינסוף ליד השבב',
    story:
      'צמיד שרשרת דק מכסף 925. בצד אחד סמל האינסוף, ובצד השני השבב, במסגרת של אבנים קטנות. הוא קל ונוח על היד, ועדיין שמים לב אליו.',
    specs: [
      { label: 'מידות הלוחית', value: '22 × 12 מ״מ' },
      { label: 'מסגרת השבב', value: '8.4 מ״מ, עם אבנים קטנות' },
      { label: 'היקף הצמיד', value: '16 ס״מ + 4 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'כסף 925 בציפוי בצבע זהב לבן, מבריק' },
    ],
    featured: true,
  },

  /* ---------- פלדה · שרשראות ---------- */
  {
    sku: 'OYANN012S',
    slug: 'al-kapayim',
    scenes: ['/scene/al-kapayim-linen.jpg'],
    name: 'עַל כַּפַּיִם',
    nameLatin: 'AL KAPAYIM',
    source: { phrase: 'הֵן עַל־כַּפַּיִם חַקֹּתִיךְ', ref: 'ישעיהו מ״ט, ט״ז' },
    category: 'necklaces',
    material: 'steel',
    finish: 'silver',
    audience: 'women',
    price: 299,
    cost: 6.0,
    image: '/products/OYANN012S.webp',
    blessings: ['eshet-chayil', 'shmira', 'bracha', 'parnasa'],
    short: 'שרשרת חמסה בעיצוב פשוט, עם השבב במרכז כף היד',
    story:
      'חמסה בעיצוב פשוט ונקי, בלי קישוטים מיותרים. השבב נמצא בדיוק במרכז כף היד, במסגרת של אבנים קטנות. חמסה מסורתית, במראה של היום.',
    specs: [
      { label: 'צורה', value: 'חמסה פתוחה (רק קו המתאר), השבב במרכז כף היד' },
      { label: 'מסגרת השבב', value: 'אבנים קטנות מסביב' },
      { label: 'אורך השרשרת', value: '45 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'פלדת אל־חלד מבריקה' },
    ],
    featured: true,
  },
  {
    sku: 'OYANN003S',
    slug: 'beseter',
    scenes: ['/scene/beseter-pair.jpg', '/scene/beseter-pair-marble.jpg', '/scene/beseter-1.jpg'],
    name: 'בְּסֵתֶר',
    nameLatin: 'BESETER',
    source: { phrase: 'יֹשֵׁב בְּסֵתֶר עֶלְיוֹן', ref: 'תהילים צ״א, א׳' },
    category: 'necklaces',
    material: 'steel',
    finish: 'silver',
    audience: 'men',
    price: 299,
    cost: 5.6,
    image: '/products/OYANN003S.webp',
    blessings: ['shmira', 'parnasa', 'bracha'],
    short: 'מגן דוד בקווים ישרים, עם השבב במרכז',
    story:
      'מגן דוד בעיצוב פשוט ונקי, בלי קישוטים. השבב נמצא בדיוק במרכז, במקום שבו שני המשולשים נפגשים.',
    specs: [
      { label: 'צורה', value: 'מגן דוד בקווים ישרים, השבב במרכז' },
      { label: 'אורך השרשרת', value: '45 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'פלדת אל־חלד מבריקה' },
    ],
  },
  {
    sku: 'OYANN003G',
    slug: 'beseter-gold',
    scenes: ['/scene/beseter-pair.jpg', '/scene/beseter-pair-marble.jpg'],
    name: 'בְּסֵתֶר',
    nameLatin: 'BESETER',
    source: { phrase: 'יֹשֵׁב בְּסֵתֶר עֶלְיוֹן', ref: 'תהילים צ״א, א׳' },
    category: 'necklaces',
    material: 'steel',
    finish: 'gold',
    audience: 'men',
    price: 369,
    cost: 6.5,
    image: '/products/OYANN003G.webp',
    blessings: ['shmira', 'parnasa', 'bracha'],
    short: 'אותו מגן דוד, בצבע זהב',
    story:
      'אותו מגן דוד מפלדת אל־חלד, בציפוי בצבע זהב.',
    specs: [
      { label: 'צורה', value: 'מגן דוד בקווים ישרים, השבב במרכז' },
      { label: 'ציפוי', value: 'בצבע זהב' },
      { label: 'אורך השרשרת', value: '45 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'פלדת אל־חלד' },
    ],
  },
  {
    sku: 'OYANN011S',
    slug: 'lo-yanum',
    scenes: ['/scene/lo-yanum-stone.jpg', '/scene/lo-yanum-hand.jpg', '/scene/lo-yanum-wood.jpg', '/scene/lo-yanum-marble.jpg', '/scene/lo-yanum-3.jpg'],
    name: 'לֹא יָנוּם',
    nameLatin: 'LO YANUM',
    source: { phrase: 'הִנֵּה לֹא־יָנוּם וְלֹא יִישָׁן שׁוֹמֵר יִשְׂרָאֵל', ref: 'תהילים קכ״א, ד׳' },
    category: 'necklaces',
    material: 'steel',
    finish: 'silver',
    audience: 'women',
    price: 299,
    cost: 6.0,
    image: '/products/OYANN011S.webp',
    blessings: ['eshet-chayil', 'shmira', 'bracha'],
    short: 'תליון בצורת עין, והשבב הוא האישון',
    story:
      'תליון בצורת עין. הוא מחובר לשרשרת משני הצדדים, ולכן יושב ישר ושטוח מתחת לצוואר. השבב, במסגרת של אבנים קטנות, הוא האישון של העין.',
    specs: [
      { label: 'צורה', value: 'תליון עין לרוחב, מחובר לשרשרת משני הצדדים' },
      { label: 'מסגרת השבב', value: 'אבנים קטנות, במרכז העין' },
      { label: 'אורך השרשרת', value: '45 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'פלדת אל־חלד מבריקה' },
    ],
  },
  {
    sku: 'OYANN006S',
    slug: 'luach-libecha',
    name: 'לוּחַ לִבֶּךָ',
    nameLatin: 'LUACH LIBECHA',
    source: { phrase: 'כָּתְבֵם עַל־לוּחַ לִבֶּךָ', ref: 'משלי ג׳, ג׳' },
    category: 'necklaces',
    material: 'steel',
    finish: 'silver',
    audience: 'men',
    price: 279,
    cost: 5.6,
    image: '/products/OYANN006S.webp',
    blessings: ['shmira', 'parnasa', 'bracha'],
    short: 'תליון מלבני, חלק ופשוט',
    story:
      'מלבן חלק, בלי סמל ובלי קישוטים. השבב נמצא בחלק התחתון שלו. זה התכשיט הכי פשוט ונקי שלנו.',
    specs: [
      { label: 'צורה', value: 'מלבן חלק לאורך, השבב בחלק התחתון' },
      { label: 'אורך השרשרת', value: '45 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'פלדת אל־חלד מבריקה' },
    ],
  },
  {
    sku: 'OYANN001G',
    slug: 'kachotam',
    scenes: ['/scene/kachotam-linen.jpg', '/scene/kachotam-stone.jpg', '/scene/kachotam-dark.jpg'],
    name: 'כַּחוֹתָם',
    nameLatin: 'KACHOTAM',
    source: { phrase: 'שִׂימֵנִי כַחוֹתָם עַל־לִבֶּךָ', ref: 'שיר השירים ח׳, ו׳' },
    category: 'necklaces',
    material: 'steel',
    finish: 'gold',
    audience: 'women',
    price: 469,
    cost: 6.8,
    image: '/products/OYANN001G.webp',
    blessings: ['shmira', 'eshet-chayil', 'bracha'],
    short: 'שרשרת בצבע זהב עם לב תלוי, והשבב בצד, קצת מעליו',
    story:
      'שני תליונים על שרשרת אחת: לב בצבע זהב שתלוי במרכז, והשבב, שיושב בצד וקצת יותר גבוה. הם לא סימטריים בכוונה, וזה מה שמייחד את השרשרת.',
    specs: [
      { label: 'צורה', value: 'לב תלוי במרכז, והשבב בצד, גבוה ממנו' },
      { label: 'ציפוי', value: 'בצבע זהב' },
      { label: 'אורך השרשרת', value: '45 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'פלדת אל־חלד' },
    ],
  },

  /* ---------- פלדה · צמידים ---------- */
  {
    sku: 'OYANB007RS',
    slug: 'avot',
    scenes: ['/scene/avot-shelf.jpg'],
    name: 'עֲבוֹת',
    nameLatin: 'AVOT',
    source: { phrase: 'בְּחַבְלֵי אָדָם אֶמְשְׁכֵם בַּעֲבֹתוֹת אַהֲבָה', ref: 'הושע י״א, ד׳' },
    category: 'bracelets',
    material: 'steel',
    finish: 'retro',
    audience: 'men',
    price: 349,
    cost: 7.0,
    image: '/products/OYANB007RS.webp',
    blessings: ['shmira', 'parnasa', 'bracha'],
    short: 'צמיד קלוע וכבד לגברים, עם השבב על לוחית במרכז',
    story:
      'שרשרת קלועה ועבה בצבע כסף מושחר. במרכז יש לוחית רחבה, ועליה השבב. זה הצמיד הכי כבד שלנו, מפלדת אל־חלד מלאה, ומרגישים אותו על היד.',
    specs: [
      { label: 'צורה', value: 'שרשרת קלועה כבדה, לוחית רחבה במרכז' },
      { label: 'היקף הצמיד', value: '18 ס״מ + 4 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי וחזק' },
      { label: 'מתכת', value: 'פלדת אל־חלד בצבע כסף מושחר' },
    ],
    badge: 'לגברים',
    featured: true,
  },
  {
    sku: 'OYANB007B',
    scenes: ['/scene/avot-black.jpg'],
    slug: 'avot-black',
    name: 'עֲבוֹת',
    nameLatin: 'AVOT',
    source: { phrase: 'בְּחַבְלֵי אָדָם אֶמְשְׁכֵם בַּעֲבֹתוֹת אַהֲבָה', ref: 'הושע י״א, ד׳' },
    category: 'bracelets',
    material: 'steel',
    finish: 'black',
    audience: 'men',
    price: 349,
    cost: 7.5,
    image: '/products/OYANB007B.webp',
    blessings: ['bracha', 'parnasa', 'shmira'],
    short: 'אותו צמיד קלוע, כולו בשחור',
    story:
      'הצמיד הקלוע בשחור. כל הצמיד מצופה בשחור, והשבב הכחול הוא הצבע היחיד עליו. פחות רגיל, ובעינינו מרשים יותר.',
    specs: [
      { label: 'צורה', value: 'שרשרת קלועה כבדה, לוחית רחבה במרכז' },
      { label: 'ציפוי', value: 'שחור, על כל הצמיד' },
      { label: 'היקף הצמיד', value: '18 ס״מ + 4 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי וחזק' },
      { label: 'מתכת', value: 'פלדת אל־חלד' },
    ],
  },
  {
    sku: 'OYANB002S',
    slug: 'libi-er',
    scenes: ['/scene/libi-er-tray.jpg'],
    name: 'לִבִּי עֵר',
    nameLatin: 'LIBI ER',
    source: { phrase: 'אֲנִי יְשֵׁנָה וְלִבִּי עֵר', ref: 'שיר השירים ה׳, ב׳' },
    category: 'bracelets',
    material: 'steel',
    finish: 'silver',
    audience: 'women',
    price: 289,
    cost: 6.0,
    image: '/products/OYANB002S.webp',
    blessings: ['eshet-chayil', 'bracha'],
    short: 'צמיד שרשרת עדין, עם לב חלק והשבב לידו',
    story:
      'צמיד לכל יום. בצד אחד לב חלק, ובצד השני השבב, במסגרת של אבנים קטנות. הוא עדין, ואפשר לענוד אותו יחד עם צמידים אחרים.',
    specs: [
      { label: 'צורה', value: 'שרשרת עדינה - לב חלק בצד אחד, השבב בשני' },
      { label: 'מסגרת השבב', value: 'אבנים קטנות' },
      { label: 'היקף הצמיד', value: '16 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'פלדת אל־חלד מבריקה' },
    ],
  },
  {
    sku: 'OYANB002G',
    slug: 'libi-er-gold',
    scenes: ['/scene/libi-er-gold-tray.jpg'],
    name: 'לִבִּי עֵר',
    nameLatin: 'LIBI ER',
    source: { phrase: 'אֲנִי יְשֵׁנָה וְלִבִּי עֵר', ref: 'שיר השירים ה׳, ב׳' },
    category: 'bracelets',
    material: 'steel',
    finish: 'gold',
    audience: 'women',
    price: 359,
    cost: 6.8,
    image: '/products/OYANB002G.webp',
    blessings: ['bracha', 'eshet-chayil'],
    short: 'אותו צמיד לב, בצבע זהב',
    story:
      'צמיד הלב בצבע זהב. הלב והשרשרת מצופים בצבע זהב. המסגרת של השבב נשארת בהירה, וכך הוא בולט יותר.',
    specs: [
      { label: 'צורה', value: 'שרשרת עדינה - לב חלק בצד אחד, השבב בשני' },
      { label: 'ציפוי', value: 'בצבע זהב' },
      { label: 'היקף הצמיד', value: '16 ס״מ + 5 ס״מ שרשרת הארכה' },
      { label: 'סוגר', value: 'קפיצי, עם טבעת לשינוי האורך' },
      { label: 'מתכת', value: 'פלדת אל־חלד' },
    ],
  },
  {
    sku: 'OYANB001S',
    slug: 'chishuk',
    name: 'חִשּׁוּק',
    nameLatin: 'CHISHUK',
    category: 'bracelets',
    material: 'steel',
    finish: 'silver',
    audience: 'men',
    price: 279,
    cost: 5.0,
    image: '/products/OYANB001S.webp',
    blessings: ['shmira', 'parnasa', 'bracha'],
    short: 'צמיד קשיח ופתוח ברוחב 6 מ״מ, עם השבב בקצה',
    story:
      'צמיד קשיח ופתוח. שמים אותו על היד בלחיצה קלה, והוא מתאים כמעט לכל יד. השבב נמצא באחד הקצוות, ורואים אותו בכל פעם שמסתכלים על השעון.',
    specs: [
      { label: 'צורה', value: 'צמיד קשיח ופתוח, שמים אותו בלחיצה קלה' },
      { label: 'רוחב', value: '6 מ״מ' },
      { label: 'מידה', value: 'פתוח - מתאים כמעט לכל יד' },
      { label: 'מתכת', value: 'פלדת אל־חלד במראה מט, עם קצוות מבריקים' },
    ],
  },
  {
    // אין עדיין שורה ב־PI לפריט הזה — המק״ט והעלות ממתינים לספק
    sku: 'BABYPIN01',
    slug: 'tzel-knafayim',
    name: 'צֵל כְּנָפַיִם',
    nameLatin: 'TZEL KNAFAYIM',
    source: { phrase: 'בְּצֵל כְּנָפֶיךָ תַּסְתִּירֵנִי', ref: 'תהילים י״ז, ח׳' },
    category: 'pins',
    material: 'silver925',
    finish: 'silver',
    audience: 'unisex',
    // מתנת לידה - נצמדת לעגלה מהיום הראשון
    ageGroup: 'newborn',
    price: 749,
    image: '/products/BABYPIN01.webp',
    blessings: ['tinok'],
    short: 'סיכה מכסף 925 לעגלת התינוק, עם ארבעה תליונים וברכת התינוק על השבב',
    story:
      'סיכת ביטחון מכסף 925, באורך 41 מ״מ. יש עליה ארבעה תליונים: חמסה, מפתח, לב, ולוחית עם השבב. מחברים אותה לעגלה, לשמיכה או לכיסא, והיא נשארת עם התינוק בשנים שבהן הוא עוד לא יכול לענוד תכשיט.',
    specs: [
      { label: 'אורך הסיכה', value: '41 מ״מ' },
      { label: 'תליונים', value: 'חמסה 14×12 · לוחית השבב 16×16 · מפתח־לב 13×8 · לב עם אבנים קטנות 12×11 מ״מ' },
      { label: 'לוחית השבב', value: '16 × 16 מ״מ, עם חלון 5 × 5 מ״מ' },
      { label: 'משקל', value: 'כ־6.5 גרם' },
      { label: 'מתכת', value: 'כסף 925 בציפוי בצבע זהב לבן, עם אבנים קטנות' },
    ],
    badge: 'מתנת לידה',
    featured: true,
  },
];

/* ---------- מחירים חיים ---------- */

/** מק״ט → המחיר שבתוקף בווקומרס */
export type PriceMap = Record<string, number>;

/**
 * מחיל על הקטלוג את המחירים שהגיעו מווקומרס.
 *
 * ------------------------------------------------------------------
 * עד 4.10.2026 המחיר חי רק בקובץ הזה, וווקומרס קבע רק כמה נגבה. עמית
 * העלה שם את כַּחוֹתָם מ-329 ל-469, והאתר המשיך להציג 329 - כלומר לקוח
 * ראה מחיר אחד והזמנה נרשמה באחר. מאז ווקומרס הוא המקור, והמספרים
 * שכתובים למעלה הם גיבוי לרגע שבו הוא לא עונה.
 *
 * הדריסה היא במקום, על אותם אובייקטים, ולא שכבה שכל קורא צריך לזכור
 * לעבור דרכה: המחיר נקרא בעשרים מקומות - כרטיסים, עגלה, צ'קאאוט, פיד,
 * סכימה - ומספיק שאחד מהם ישכח כדי ששני מחירים יופיעו לאותו דגם.
 *
 * מי קורא לזה: `syncPrices` בצד השרת, ו-`<LivePrices>` בצד הלקוח (וגם
 * בזמן ה-SSR של רכיבי הלקוח, שרצים על עותק נפרד של המודול הזה).
 *
 * מק״ט שחסר במפה נשאר על המחיר האחרון שהיה לו. מפה ריקה אינה משנה דבר.
 * ------------------------------------------------------------------
 */
export function applyPrices(map: PriceMap) {
  for (const p of PRODUCTS) {
    const live = map[p.sku];
    if (typeof live === 'number' && Number.isFinite(live) && live > 0) p.price = live;
  }
}

/* ---------- נגזרות ---------- */

/** גימור -> הצבע שמייצג אותו בעיגול הבחירה */
export const FINISH_SWATCH: Record<Finish, string> = {
  silver: 'linear-gradient(145deg, #f2f3f5, #b9bcc1 58%, #86898f)',
  gold: 'linear-gradient(145deg, #f3e3b4, #c9a24b 58%, #8d6c22)',
  black: 'linear-gradient(145deg, #55565b, #2b2b2e 58%, #141416)',
  retro: 'linear-gradient(145deg, #dcd6c8, #a8a093 58%, #6f6a5e)',
};

/**
 * אותו עיצוב בגימורים שונים. הם נבדלים במק״ט ובמחיר אבל נושאים שם אחד,
 * ולכן השם הוא המפתח: שני כרטיסים באותה כותרת נראים כמו תקלה.
 */
export function finishSiblings(product: Product) {
  return PRODUCTS.filter((p) => p.name === product.name);
}

/**
 * צילומי הקטגוריה, לפס השבירה שבאמצע העמוד.
 *
 * צילום אחד לכל דגם. הרשימה הגולמית מסודרת לפי מוצר, ולכן שני
 * הראשונים בה תמיד מאותו תכשיט - ופס שבירה עם אותו דגם פעמיים,
 * בשני צילומים כהים, נראה כמו טעות ולא כמו בחירה.
 */
export function categoryPhotos(id: CategoryId) {
  return PRODUCTS.filter((p) => p.category === id)
    .map((p) => p.scenes?.[0])
    .filter((src): src is string => Boolean(src));
}

/**
 * הצילום שמותר להניח מתחת לכותרת הקטגוריה.
 *
 * לא כל צילום מתאים לזה. הכותרת בדיו כהה יושבת עליו, ונמדד שצילום
 * כהה מפיל אותה מתחת לתקן: avot-black נתן 3.08:1 בצעיף 40%, ואילו
 * beseter-2 נותן 8.79:1 באותו צעיף. לכן הרשימה סגורה ומבוססת מדידה,
 * וקטגוריה בלי צילום מאושר מקבלת כותרת על קרם - שזה עדיף על כותרת
 * שאי אפשר לקרוא.
 */
export type Banner = {
  src: string;
  /** object-position - איפה החיתוך לרצועת 16:7 יושב על הצילום */
  position?: string;
  /** היפוך אופקי, כשהשטח הריק של הצילום יושב בצד הלא נכון לטקסט */
  flip?: boolean;
};

/**
 * הבאנר של כל קטגוריה, במפורש.
 *
 * הרשימה המאושרת הקודמת סיננה רק צילומי מוצר מתוך הקטגוריה, ולכן
 * לצמידים ולתינוק לא היה באנר בכלל - כותרת על קרם ריק. שלושת אלה
 * נמדדו באותה שיטה (צעיף 40%, אחוזון 5 של הניגודיות באזור הטקסט,
 * בשלושה רוחבי מסך): שרשראות 10.0:1, צמידים 12.0:1, לתינוק 11.0:1.
 *
 * לתינוק אין צילום של הסיכה, ולכן הרקע שלה הוא צילום הבית - הזוג
 * בפתח הדלת, הפוך כדי שהקיר הריק ינחת מתחת לכותרת.
 *
 * מיקום החיתוך נקבע לפי איפה התכשיט יושב בצילום, ולא לפי המרכז:
 * הרצועה היא 16:7 והשליש התחתון שלה דוהה לקרם, ובכל שלושת הצילומים
 * התכשיט יושב בשני השלישים התחתונים של הפריים. חיתוך למרכז הראה
 * שרשרת בלי תליון. y=100% מצמיד את החיתוך לתחתית, והתכשיט עולה אל
 * החלק הנקי של הרצועה: החמסה בשורה 46% שלה, הלב והשבב של הצמיד
 * ב-34% ו-46%. וההיפוך בשרשראות מזיז את החמסה שמאלה, אל מחוץ לטקסט.
 */
const CATEGORY_BANNERS: Partial<Record<CategoryId, Banner>> = {
  necklaces: { src: '/scene/al-kapayim-linen.jpg', position: '50% 100%', flip: true },
  bracelets: { src: '/scene/libi-er-tray.jpg', position: '50% 90%' },
  pins: { src: '/worn/scene-doorway.jpg', position: '50% 100%', flip: true },
};

export function categoryBanner(id: CategoryId): Banner | null {
  return CATEGORY_BANNERS[id] ?? null;
}

/**
 * צילום לכרטיס הברכה: תכשיט שבאמת נושא את הנוסח הזה.
 *
 * הבחירה נעשית פעם אחת לכל הברכות יחד ולא לכל אחת בנפרד, כדי שאותו
 * צילום לא יופיע בשני כרטיסים סמוכים - ארבע מתוך חמש הברכות נישאות
 * על אותם דגמים מצולמים, ובחירה עצמאית הייתה מחזירה את תולדות שלוש
 * פעמים.
 *
 * ברכת התינוק נישאת על הסיכה בלבד, ולה אין צילום סצנה. היא מקבלת
 * null והכרטיס נופל בחזרה לפס צבע נקי.
 */
export function blessingPhotos(order: string[]): Record<string, string | null> {
  const used = new Set<string>();
  const out: Record<string, string | null> = {};

  for (const id of order) {
    const carrier = PRODUCTS.find(
      (p) => p.blessings.includes(id as never) && p.scenes?.[0] && !used.has(p.scenes[0]),
    );
    const photo = carrier?.scenes?.[0] ?? null;
    if (photo) used.add(photo);
    out[id] = photo;
  }
  return out;
}

/** דגם אחד לכל עיצוב - לרשימות. הגימורים נבחרים בתוך עמוד המוצר */
export function uniqueDesigns(list: Product[]) {
  const seen = new Set<string>();
  return list.filter((p) => (seen.has(p.name) ? false : seen.add(p.name)));
}

export function productsByCategory(id: CategoryId) {
  return uniqueDesigns(PRODUCTS.filter((p) => p.category === id));
}

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductBySku(sku: string) {
  return PRODUCTS.find((p) => p.sku === sku);
}

/** קטגוריות שיש בהן לפחות דגם אחד — טבעות ייעלמו מעצמן עד שיגיעו */
export const ACTIVE_CATEGORIES = CATEGORY_ORDER.filter((id) =>
  PRODUCTS.some((p) => p.category === id),
);

export const featuredProducts = uniqueDesigns([
  ...PRODUCTS.filter((p) => p.featured),
  ...PRODUCTS.filter((p) => !p.featured),
]).slice(0, 4);

export function formatPrice(value: number) {
  return `₪${value.toLocaleString('he-IL')}`;
}

/** טווח המחירים בקטגוריה — מוצג בכרטיסי הקטגוריות */
export function priceRange(id: CategoryId) {
  const prices = productsByCategory(id).map((p) => salePrice(p.price));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}


/* ============================================================
   מפרטים שנכונים לכל הקטלוג — מוצגים בעמוד המוצר לצד
   המפרט הייחודי של הדגם.
   ============================================================ */

/** מודול הננו — זהה בכל הפריטים */
export const CHIP_SPEC: { label: string; value: string }[] = [
  // "שטח כתיבה 0.5 מ״מ²" ישב כאן בלי מקור, ועם 4,937 תווים באות של
  // 0.035 מ״מ הוא גם בלתי אפשרי חשבונית. ירד עד שהמפעל יענה על השטח
  { label: 'שטח החריטה', value: '5 × 5 מ״מ' },
  // "ליתוגרפיית קרן יונים ממוקדת" ישב כאן בלי מקור. המפעל (17.9.2026): לייזר
  { label: 'שיטה', value: 'חריטה בלייזר' },
  // תשובת המפעל (17.9.2026): "each regular letter is about 0.035 mm in
  // height, and even the larger title letters are no bigger than 0.1 mm"
  { label: 'גובה האות', value: 'בערך 0.035 מ״מ · אותיות הכותרת עד 0.1 מ״מ' },
  { label: 'החומר של השבב', value: 'זכוכית' },
  { label: 'הגנה', value: 'חלון סגור ואטום, שעמיד למים, לזיעה ולמוצרי קוסמטיקה' },
  { label: 'בדיקה', value: 'משווים לטקסט המקורי לפני שמכניסים את השבב לתכשיט' },
];

export const BOX_SPEC: { label: string; value: string }[] = [
  { label: 'אריזה', value: 'קופסה מרופדת - כלולה במחיר. אריזת מתנה קשיחה בתוספת ₪49' },
  { label: 'כרטיס ברכה', value: 'שם הברכה, מאיפה היא לקוחה, והברכה המלאה' },
  { label: 'משלוח', value: `מבוטח · ${deliveryLine}` },
];

export const CARE_SPEC: { label: string; value: string }[] = [
  { label: 'שימוש יומיומי', value: 'להוריד לפני מקלחת, ים ובריכה' },
  // המפעל (17.9.2026): "Ultrasonic cleaning is not recommended, as vibration may affect the chip"
  { label: 'ניקוי', value: 'בד מיקרופייבר יבש. בלי חומרי ניקוי חזקים ובלי מכשיר ניקוי אולטרסוני' },
  { label: 'אחסון', value: 'בקופסה המקורית, בנפרד מתכשיטים אחרים' },
  { label: 'אחריות', value: 'שנה על פגמים בייצור ובהלחמות. האחריות לא כוללת שבר שנגרם משימוש' },
  { label: 'החזרה', value: `${POLICY.returnDays} יום מקבלת החבילה, באריזה המקורית. את משלוח ההחזרה משלם הלקוח. אם יש פגם - אנחנו משלמים` },
];

/**
 * הצילום הטוב ביותר שיש לדגם, לפי סדר יורד של כוח שכנוע.
 *
 * בדיקות שימושיות מראות שתכשיטים הם בין הקטגוריות שבהן חיתוך על רקע
 * לבן אינו מספיק: בלי לראות את הפריט על גוף אי אפשר לשפוט את גודלו
 * ואת נפילתו. הרשת ממשיכה להציג את החיתוך כדי שתישאר סרוקה והשוואתית,
 * והצילום נחשף עליו - ולכן הסדר כאן הוא מה שגובר על החיתוך, לא מה
 * שמחליף אותו.
 */
export function photoFor(
  product: Product,
): { src: string; kind: 'worn' | 'scene'; focus: string } | null {
  const shot = wornFor(product.slug);
  if (shot) {
    return { src: shot.file, kind: 'worn', focus: wornFocus(shot, product.slug) };
  }
  const scene = product.scenes?.[0];
  return scene ? { src: scene, kind: 'scene', focus: sceneFocus(scene, product.slug) } : null;
}

/**
 * מוקד החיתוך של צילומי הסצנה, כערך object-position.
 *
 * הגלריה בדף המוצר היא ריבוע. צילום לרוחב מאבד בו רבע מכל צד וזה
 * נסבל, אבל שלושת הצילומים לגובה (788x1400) מאבדים 44% מהגובה, ובכולם
 * התכשיט יושב בשני־שלישים התחתונים - כלומר חיתוך למרכז דוחף אותו
 * לשפה. שלושתם נמדדו בנפרד ולא הוערכו לפי דפוס.
 */
const SCENE_FOCUS: Record<string, string> = {
  '/scene/toldot-3.jpg': '50% 67%',
  '/scene/lo-yanum-3.jpg': '49% 65%',
};

/**
 * מוקד לכל דגם בנפרד, כשאותו צילום משרת כמה דגמים.
 *
 * בצילום מגן דוד נראים שני הגימורים יחד: הזהב ב-40%/70% והכסף
 * ב-55%/77%. בלי הבחנה, שני עמודי המוצר הציגו את אותה תמונה בדיוק
 * ובשניהם נראה גם הפריט שלא קונים - כלומר עמוד הזהב מכר כסף.
 * המפתח הוא "slug|src", כי המוקד תלוי בשניהם.
 */
const SCENE_FOCUS_BY_PRODUCT: Record<string, string> = {
  'beseter-gold|/scene/beseter-pair.jpg': '40% 70%',
  'beseter|/scene/beseter-pair.jpg': '55% 77%',
  'beseter-gold|/scene/beseter-pair-marble.jpg': '40% 70%',
  'beseter|/scene/beseter-pair-marble.jpg': '55% 77%',
};

export function sceneFocus(src: string, slug?: string) {
  if (slug) {
    const perProduct = SCENE_FOCUS_BY_PRODUCT[`${slug}|${src}`];
    if (perProduct) return perProduct;
  }
  return SCENE_FOCUS[src] ?? '50% 50%';
}

/**
 * המידה של הדגם, לשורת המטא בכרטיס.
 *
 * 42% מהקונים מנסים לשפוט גודל פיזי מהתמונה ו-37% מהאתרים לא נותנים
 * שום רמז. בכרטיס שהצילום בו הוא חיתוך על לבן אין שום קנה מידה, ולכן
 * המידה נשלפת מהמפרט - הערך הראשון שנקוב במילימטרים או בסנטימטרים.
 * מוצג מקוצר: "29.2 מ״מ", בלי שרשראות ההארכה שמאריכות את השורה.
 */
export function sizeCue(product: Product): string | null {
  const spec = product.specs.find((s) => /מ״מ|ס״מ/.test(s.value));
  if (!spec) return null;
  return spec.value.split(' + ')[0].trim();
}
