'use client';

import { useEffect } from 'react';
import { rememberViewed } from '@/lib/viewed';

/** בעמוד מוצר: רושם שהדגם נצפה (lib/viewed.ts) */
export default function ViewedSync({ slug }: { slug: string }) {
  useEffect(() => {
    rememberViewed(slug);
  }, [slug]);
  return null;
}
