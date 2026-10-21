'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PROMO, promoOn } from '@/lib/promo';
import { CLUB_JOINED, CLUB_OPEN } from '@/components/SignupPopup';

/**
 * כפתור צף "20% הנחה בהצטרפות למועדון", שנשאר בפינת המסך בזמן הגלילה
 * ופותח את חלון ההצטרפות (SignupPopup).
 *
 * עמית, 21.10.2026: "זה אמור להיות כפתור שיורד עם הלקוח להצטרפות
 * למועדון". עד אז זו הייתה תווית בפינת ההירו, שלא עשתה כלום.
 *
 * בפינה הימנית: בשמאלית יושבים כפתור הנגישות והוואטסאפ. רק בעמוד
 * הבית (עמית: "שזה יהיה רק בעמוד בית!"), ונעלם אצל מי שכבר הצטרף.
 */
export default function ClubButton() {
  const pathname = usePathname();
  const [joined, setJoined] = useState(true);

  useEffect(() => {
    try {
      setJoined(Boolean(localStorage.getItem(CLUB_JOINED)));
    } catch {
      setJoined(false);
    }
    const onJoined = () => setJoined(true);
    window.addEventListener(CLUB_JOINED, onJoined);
    return () => window.removeEventListener(CLUB_JOINED, onJoined);
  }, []);

  if (!promoOn || joined || pathname !== '/') return null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CLUB_OPEN))}
      className={`fixed right-4 z-[90] bottom-4 rounded-lg px-4 py-2.5 shadow-lg transition-transform hover:-translate-y-0.5`}
      style={{ background: '#18223f', color: '#fff', fontSize: 'var(--fs-sm)', fontWeight: 700 }}
    >
      לקבלת {PROMO.percent}% הנחה
    </button>
  );
}
