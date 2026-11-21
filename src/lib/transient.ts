// Errors worth retrying on their own: no answer at all (offline, timeout, the
// server still starting up) or a temporary server failure. A 4xx is the
// server's real answer and is never retried.
export function isTransientError(error: any): boolean {
  if (!error) return false
  if (error.cpTransient) return true
  if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError') return false
  const response = error.response
  if (!response) return true
  const status = Number(response.status)
  // The team paused this feature from the console: that's an answer, not a hiccup.
  if (status === 503 && response.data?.detail?.code === 'feature_paused') return false
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504 || status === 500
}

/** React Query `retry` that keeps trying through a slow start (about a minute with 12 s timeouts). */
export const retryTransient =
  (attempts = 4) =>
  (failureCount: number, error: unknown) =>
    isTransientError(error) && failureCount < attempts

/** 1 s, 2 s, 4 s, then 8 s between tries. */
export const retryBackoff = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000)
