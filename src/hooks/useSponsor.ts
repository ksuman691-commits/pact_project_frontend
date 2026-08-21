'use client';

import { useEffect, useState } from 'react';
import { sponsorService, type Sponsor } from '@/services/api';

export function useSponsor(category?: string | null) {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSponsor(null);
    if (!category) return;

    sponsorService
      .getByCategory(category)
      .then((result) => {
        if (!cancelled) setSponsor(result);
      })
      .catch((error) => {
        console.log('[v0] Sponsor lookup failed:', error instanceof Error ? error.message : error);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return sponsor;
}
