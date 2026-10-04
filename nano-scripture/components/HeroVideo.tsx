'use client';

import { useEffect, useRef } from 'react';

/**
 * סרטון ההירו. רכיב לקוח משתי סיבות:
 *
 * 1. React אינו כותב את התכונה muted ל-HTML שיוצא מהשרת, ובלעדיה
 *    הדפדפן חוסם ניגון אוטומטי. לכן ההשתקה והניגון נעשים כאן, אחרי
 *    הטעינה, ולא בתכונת autoPlay.
 * 2. מי שביקש במערכת פחות תנועה רואה את תמונת הפתיחה בלבד. preload
 *    עומד על metadata, כך שבמקרה הזה הסרטון עצמו אינו יורד כלל.
 *
 * שני קבצים: 720p לטלפון ו-1080p למסך רחב. הבחירה נעשית ב-media של
 * source, לפני ההורדה - טלפון אינו מוריד את הקובץ הגדול.
 */
export default function HeroVideo({ className, label }: { className?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = () => {
      v.muted = true;
      // דפדפן שחוסם ניגון נשאר על תמונת הפתיחה - אין מה לדווח
      v.play().catch(() => {});
    };
    start();

    // עמוד שנפתח בלשונית רקע אינו מתחיל לנגן. בלי ההאזנה הזו הסרטון
    // נשאר עומד גם אחרי שחוזרים ללשונית - נמדד בבדיקה מקומית
    const onVisible = () => {
      if (!document.hidden && v.paused) start();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="metadata"
      poster="/hero/shoot-day-poster.jpg"
      aria-label={label}
    >
      <source media="(max-width: 767px)" src="/hero/shoot-day-720.mp4" type="video/mp4" />
      <source src="/hero/shoot-day-1080.mp4" type="video/mp4" />
    </video>
  );
}
