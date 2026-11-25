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

/** React Query `retry` that keeps trying through a slow start. Fast 429s from a waking server need more tries than timeouts do. */
export const retryTransient =
  (attempts = 4) =>
  (failureCount: number, error: unknown) =>
    isTransientError(error) && failureCount < attempts

/** 1 s, 2 s, 4 s, then 8 s between tries. */
export const retryBackoff = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000)

/**
 * The server didn't really answer: no reply, a gateway error, or a 429 with no reason
 * attached (Render's "waking up" page). Our own rate limit always says why, so it is
 * NOT counted here and is never retried.
 */
export function isServerNotReady(error: any): boolean {
  if (!error || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return false
  const response = error.response
  if (!response) return true
  const status = Number(response.status)
  if (status === 502 || status === 503 || status === 504) return response.data?.detail?.code !== 'feature_paused'
  return status === 429 && !response.data?.detail
}

/**
 * Run a one-off request (signing in) and keep retrying while the server is starting,
 * for up to about two minutes (1, 2, 4, then 8 s apart): a sleeping Render server took ~65 s to wake. `onWaiting` fires once, on the
 * first retry, so the screen can say what's happening.
 */
export async function untilServerAnswers<T>(request: () => Promise<T>, onWaiting?: () => void, maxWaitMs = 120_000): Promise<T> {
  const started = Date.now()
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await request()
    } catch (error) {
      const delay = retryBackoff(attempt)
      if (!isServerNotReady(error) || Date.now() - started + delay > maxWaitMs) throw error
      if (attempt === 0) onWaiting?.()
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}
