'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { companionsFor, forWhom } from '@/lib/companions';
import { saveJoin, untilLine } from '@/lib/join';
import type { ShippingMethodId } from '@/lib/policy';

type Info = { id: number; number: string; placedAt: string; shipping: ShippingMethodId; slugs: string[] };

/**
 * "עוד תכשיט לאותה חבילה" - מעמוד התודה ומהמייל של ההזמנה.
 *
 * השרת בודק שההזמנה עוד לא יצאה (/api/join). אם כן - נשמרת הצטרפות
 * בלשונית (lib/join.ts), והעגלה והקופה מכירות אותה: בלי דמי משלוח,
 * ואותם פרטים. ההצעות הן לאותו אדם שבשבילו קנו (lib/companions.ts).
 */
export default function JoinOffer() {
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const o = q.get('o');
    const k = q.get('k');
    if (!o || !k) {
      setError('הקישור לא שלם.');
      return;
    }
    fetch(`/api/join?o=${encodeURIComponent(o)}&k=${encodeURIComponent(k)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? 'משהו השתבש');
        return d as Info;
      })
      .then((d) => {
        saveJoin({ id: d.id, key: k, number: d.number, placedAt: d.placedAt, shipping: d.shipping });
        setInfo(d);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="max-w-xl">
        <h1 className="display t-2">אי אפשר להוסיף לחבילה הזו</h1>
        <p className="lede mt-4">{error}</p>
        <Link href="/catalog" className="btn btn-solid mt-8 inline-block">
          לכל התכשיטים
        </Link>
      </div>
    );
  }
  if (!info) return null;

  const whom = forWhom(info.slugs);
  const picks = companionsFor(info.slugs, 3);

  return (
    <>
      <h1 className="display t-1">להוסיף לאותה חבילה</h1>
      <p className="lede mt-4 max-w-xl">
        עוד תכשיט{whom ? ` ${whom}` : ''}? הוא נכנס לאותה קופסה של הזמנה{' '}
        <span className="num">#{info.number}</span>, בלי דמי משלוח. אפשר להוסיף{' '}
        {untilLine(new Date(info.placedAt))}, כשהחבילה יוצאת.
      </p>
      <p className="mt-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
        בוחרים תכשיט וברכה, ומשלמים כרגיל. הפרטים שלך כבר ממולאים.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        {picks.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} priority={i < 3} />
        ))}
      </div>

      <Link href="/catalog" className="link-u mt-10 inline-block" style={{ color: 'var(--accent-deep)' }}>
        לכל התכשיטים ←
      </Link>
    </>
  );
}
