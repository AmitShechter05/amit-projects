'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { CLARITY_ID, GA_ID, PIXEL_ID, analyticsOn, trackPageView } from '@/lib/analytics';
import { hasConsent } from '@/lib/consent';

/**
 * טעינת סקריפטי המדידה - מהכניסה, אלא אם הגולש אמר "לא, תודה"
 * (lib/consent.ts, 1.11.2026).
 *
 * מי שסירב בביקור קודם לא מוריד את הקוד בכלל. מי שסירב עכשיו, אחרי
 * שהסקריפטים כבר נטענו - שניהם נעצרים במקום: גוגל דרך
 * `ga-disable-<מזהה>`, מטא דרך `fbq('consent','revoke')`, ו-Clarity דרך
 * `clarity('stop')`. בלי זה הם
 * היו ממשיכים לספור צפיות עד הרענון הבא.
 */
export default function Analytics() {
  const pathname = usePathname();
  const [granted, setGranted] = useState(false);
  /**
   * הצפייה הראשונה נספרת על ידי `config` של גוגל ועל ידי `PageView`
   * של מטא, בתוך קוד האתחול. בלי הדילוג הזה כל כניסה נספרת פעמיים.
   */
  const counted = useRef(false);

  useEffect(() => {
    if (!analyticsOn) return;
    const sync = () => {
      const ok = hasConsent('analytics');
      const w = window as unknown as Record<string, unknown> & {
        fbq?: (...a: unknown[]) => void;
        clarity?: (...a: unknown[]) => void;
      };
      if (GA_ID) w[`ga-disable-${GA_ID}`] = !ok;
      if (w.fbq) w.fbq('consent', ok ? 'grant' : 'revoke');
      if (w.clarity) w.clarity(ok ? 'start' : 'stop');
      setGranted(ok);
    };
    sync();
    window.addEventListener('mikra:consent', sync);
    return () => window.removeEventListener('mikra:consent', sync);
  }, []);

  // ניווט פנימי. האתר הוא אפליקציית עמוד יחיד, והסקריפטים נטענים
  // פעם אחת - בלי זה כל המסע אחרי העמוד הראשון לא מתועד
  useEffect(() => {
    if (!granted) return;
    if (!counted.current) {
      counted.current = true;
      return;
    }
    trackPageView(pathname ?? '/');
  }, [granted, pathname]);

  if (!analyticsOn || !granted) return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
window.gtag=gtag;
gtag('js',new Date());
gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}

      {/* רק בדומיין האמיתי: Vercel פותח כל גרסה חדשה בבוט מכתובת זמנית,
          וההקלטות שלו מילאו את Clarity ביום הראשון (2.11.2026) */}
      {CLARITY_ID && /(^|\.)mikra\.shop$/.test(window.location.hostname) && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}

      {PIXEL_ID && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');
fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
