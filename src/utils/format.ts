/**
 * Format a count as a human-readable string
 * 0 → "0"
 * 42 → "42"
 * 873 → "873"
 * 1234 → "1.2k"
 * 1000 → "1k"
 * 1000000 → "1m"
 */
export function formatCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) return '0';
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}m`.replace(/\.0m$/, 'm');
  }
  
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`.replace(/\.0k$/, 'k');
  }
  
  return String(Math.floor(count));
}

/**
 * Format a number as currency
 * 1000 → "$1,000.00"
 * 1000.5 → "$1,000.50"
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a percentage
 * 0.75 → "75%"
 * 0.333 → "33%"
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a date to a readable string
 * Date → "Mar 15, 2024"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a time difference as relative time
 * Date from 2 hours ago → "2h ago"
 * Date 1 day in future → "in 1d"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isInFuture = diffMs > 0;
  const prefix = isInFuture ? 'in ' : '';
  const suffix = isInFuture ? '' : ' ago';

  const absDays = Math.abs(diffDays);
  const absHours = Math.abs(diffHours) % 24;
  const absMins = Math.abs(diffMins) % 60;

  if (absDays > 0) {
    return `${prefix}${absDays}d${suffix}`;
  }
  if (absHours > 0) {
    return `${prefix}${absHours}h${suffix}`;
  }
  if (absMins > 0) {
    return `${prefix}${absMins}m${suffix}`;
  }
  return 'now';
}
