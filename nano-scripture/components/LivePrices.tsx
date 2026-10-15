'use client';

import type { ReactNode } from 'react';
import { applyPrices, applyStock, type PriceMap, type StockMap } from '@/lib/catalog';
import { applyRatings, type RatingMap } from '@/lib/ratings';

/**
 * מחיל את מחירי ווקומרס על הקטלוג שבדפדפן.
 *
 * הקטלוג נארז לתוך ה-JS של הלקוח עם המחירים שבקוד. העגלה, עמוד המוצר
 * והצ'קאאוט קוראים ממנו ישירות, מחוץ ל-React, ולכן אין להם דרך לקבל
 * מחיר דרך props. במקום זה הפריסה מעבירה לכאן את המפה שהשרת קרא,
 * והרכיב דורס את המחירים לפני שהילדים שלו מרונדרים.
 *
 * זו כתיבה בזמן רינדור, ובכוונה: אפקט היה רץ אחרי שהילדים כבר ציירו
 * את המחיר הישן, והיה נוצר הבדל בין ה-HTML מהשרת לבין הדפדפן. הכתיבה
 * חוזרת על עצמה בלי נזק - אותה מפה נותנת אותה תוצאה.
 */
export default function LivePrices({
  prices,
  stock,
  ratings,
  children,
}: {
  prices: PriceMap;
  /** המלאי לפי ברכה - מוחל באותו אופן, מאותה סיבה */
  stock: StockMap;
  /** ממוצע ומספר הביקורות לכל דגם - לכוכבים בכרטיסים */
  ratings?: RatingMap;
  children: ReactNode;
}) {
  applyPrices(prices);
  applyStock(stock);
  applyRatings(ratings ?? {});
  return <>{children}</>;
}
