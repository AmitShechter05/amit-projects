/**
 * פרטי העוסק. מקור אמת יחיד למסמכים המשפטיים.
 *
 * שדה שעדיין לא ידוע נשאר null ולא מחרוזת ממלאת־מקום, כדי שהמסמך
 * ידלג עליו בשקט במקום להדפיס סימן שאלה באמצע משפט משפטי.
 */
export const COMPANY = {
  legalName: 'מקרא',
  /** מספר עוסק ליחיד, או ח.פ. לחברה */
  regNumber: 'עוסק מורשה 2155396360',
  address: 'גולדה מאיר 112, מודיעין',
  email: 'mikrajewelry@gmail.com',
  /** חוק הגנת הצרכן מחייב אמצעי קשר טלפוני */
  phone: '053-371-4872' as string | null,
  /** ערוץ הביטול הרשמי. ללא מספר אי אפשר לממש אותו בפועל */
  whatsapp: '053-371-4872' as string | null,
  /**
   * ממונה נגישות - נדרש בהצהרת הנגישות.
   *
   * התקנות מבקשות שם ואמצעי קשר. כאן יש רק אמצעי קשר, כי שם לא
   * נמסר - ואת השם של אדם אמיתי לא ממציאים. שווה להשלים.
   */
  accessibilityContact: 'בטלפון 053-371-4872 או באימייל mikrajewelry@gmail.com' as string | null,
  updated: 'אוגוסט 2026',
};

/**
 * חשבונות ברשתות - רק חשבון שקיים באמת. קישורים שהובילו ל-# הוסרו
 * מהפוטר בספטמבר; מכאן הם חוזרים אחד-אחד, כשהחשבון נפתח.
 * מוצג בפוטר ונכנס ל-sameAs בסימון המובנה - שני המקומות מהרשימה הזו.
 *
 * אינסטגרם @mikra.jewelry נבדק פתוח ב-16.10.2026 (עמית אישר שהוא שלו).
 * טיקטוק, פייסבוק, פינטרסט - נכנסים כאן כשייפתחו.
 */
export const SOCIAL: { label: string; url: string }[] = [
  { label: 'אינסטגרם', url: 'https://www.instagram.com/mikra.jewelry/' },
];

/** מה שעדיין חסר וחובה על פי דין. ריק = אפשר לפרסם */
export const MISSING: string[] = [
  ...(COMPANY.phone ? [] : ['טלפון ליצירת קשר']),
  ...(COMPANY.whatsapp ? [] : ['מספר וואטסאפ - ערוץ הביטול שהוגדר בתקנון']),
  ...(COMPANY.accessibilityContact ? [] : ['שם ואמצעי קשר של ממונה נגישות']),
];

/** שורת יצירת הקשר, בלי פסיק תלוי כשאין טלפון */
export const contactLine = [COMPANY.email, COMPANY.phone].filter(Boolean).join(' · ');

/** ספרות בלבד, לקישורי tel: */
export const telHref = COMPANY.phone ? `tel:${COMPANY.phone.replace(/\D/g, '')}` : null;

/**
 * קישור וואטסאפ. wa.me דורש פורמט בינלאומי בלי אפס מוביל ובלי
 * מקפים - 050 הופך ל-97250
 */
export const waHref = COMPANY.whatsapp
  ? `https://wa.me/972${COMPANY.whatsapp.replace(/\D/g, '').replace(/^0/, '')}`
  : null;
