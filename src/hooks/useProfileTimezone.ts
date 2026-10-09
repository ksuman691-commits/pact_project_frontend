'use client';

import { useMutation } from '@tanstack/react-query';
import { profileTimezoneService } from '@/services/api';

export function useSyncProfileTimezone() {
  return useMutation({
    mutationFn: async (deviceTimezone: string) => {
      const { data } = await profileTimezoneService.get();
      if (data.timezone === deviceTimezone) return data;
      const updated = await profileTimezoneService.update(deviceTimezone);
      return updated.data;
    },
  });
}
