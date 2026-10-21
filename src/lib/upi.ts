/** Helpers for UPI tips. CirclePact never handles the money: we only build the
 * standard upi://pay link that GPay, PhonePe, Paytm and BHIM all understand. */

export const UPI_ID_PATTERN = /^[A-Za-z0-9.\-_]{2,256}@[A-Za-z][A-Za-z0-9]{1,63}$/

export function isValidUpiId(value: string) {
  return UPI_ID_PATTERN.test(value.trim())
}

export function buildUpiUri({ upiId, payeeName, note, amount }: { upiId: string; payeeName?: string; note?: string; amount?: number | null }) {
  // The UPI ID goes in as-is (it only has safe characters); some UPI apps
  // don't decode %40 back to @.
  const parts = [`pa=${upiId.trim()}`]
  if (payeeName) parts.push(`pn=${encodeURIComponent(payeeName.trim())}`)
  if (note) parts.push(`tn=${encodeURIComponent(note.slice(0, 50))}`)
  if (amount && amount > 0) parts.push(`am=${amount.toFixed(2)}`)
  parts.push('cu=INR')
  return `upi://pay?${parts.join('&')}`
}

/** Reads the UPI ID and name out of the text inside a GPay/PhonePe QR code. */
export function parseUpiUri(text: string): { upiId: string; payeeName: string | null } | null {
  const trimmed = text.trim()
  if (!/^upi:\/\/pay\?/i.test(trimmed)) return isValidUpiId(trimmed) ? { upiId: trimmed, payeeName: null } : null
  try {
    const params = new URLSearchParams(trimmed.slice(trimmed.indexOf('?') + 1))
    const upiId = params.get('pa')?.trim()
    if (!upiId || !isValidUpiId(upiId)) return null
    return { upiId, payeeName: params.get('pn')?.trim() || null }
  } catch {
    return null
  }
}

/** Decodes a QR code from an uploaded image (a GPay "scan to pay" screenshot). */
export async function readQrFromImage(file: File): Promise<string | null> {
  const { default: jsQR } = await import('jsqr')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' })?.data ?? null
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function isLikelyMobile() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}
