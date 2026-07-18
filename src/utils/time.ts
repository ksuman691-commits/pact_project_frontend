/**
 * Calculate pact progress information
 * Returns: { daysCurrent, daysTotal, endsIn }
 * Used to display "Day X of Y" and "Ends in Xd Xh"
 */
export function calculatePactProgress(
  startDate: string | Date,
  endDate: string | Date
): {
  daysCurrent: number;
  daysTotal: number;
  endsIn: string;
  isEnded: boolean;
} {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();

  // Calculate total days
  const totalMs = end.getTime() - start.getTime();
  const daysTotal = Math.ceil(totalMs / (1000 * 60 * 60 * 24));

  // Calculate current day
  const elapsedMs = now.getTime() - start.getTime();
  const daysCurrent = Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1;

  // Calculate time remaining
  const remainingMs = end.getTime() - now.getTime();
  const isEnded = remainingMs <= 0;

  let endsIn = 'Ended';
  if (!isEnded) {
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (remainingDays > 0) {
      endsIn = `Ends in ${remainingDays}d ${remainingHours}h`;
    } else if (remainingHours > 0) {
      endsIn = `Ends in ${remainingHours}h`;
    } else {
      endsIn = 'Ends soon';
    }
  }

  return {
    daysCurrent: Math.max(1, Math.min(daysCurrent, daysTotal)),
    daysTotal,
    endsIn,
    isEnded,
  };
}

/**
 * Format a time range
 * "2024-01-15T10:00:00Z" → "Jan 15, 2024"
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const startStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(start);

  const endStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(end);

  return `${startStr} - ${endStr}`;
}

/**
 * Get days remaining until a date
 * Returns negative number if date has passed
 */
export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Check if a date is this week
 */
export function isThisWeek(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return d >= startOfWeek && d <= endOfWeek;
}

/**
 * Format elapsed time
 * "2024-01-15T10:00:00Z" → "2 hours ago" (if 2 hours have passed since)
 */
export function formatElapsedTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const elapsedMs = now.getTime() - d.getTime();
  const elapsedSecs = Math.floor(elapsedMs / 1000);

  if (elapsedSecs < 60) return 'just now';
  
  const elapsedMins = Math.floor(elapsedSecs / 60);
  if (elapsedMins < 60) return `${elapsedMins}m ago`;
  
  const elapsedHours = Math.floor(elapsedMins / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

/**
 * Get a human-readable duration string
 * 3600000 (1 hour in ms) → "1h"
 * 60000 (1 minute in ms) → "1m"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
