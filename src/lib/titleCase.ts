/**
 * Capitalises the first letter of every word, leaving the rest of each word
 * alone (so "5km", "UPI" and "iPhone"-style words aren't flattened).
 * "Sleep early 20 nights in 30 Days" -> "Sleep Early 20 Nights In 30 Days".
 */
export function titleCase(value: string | null | undefined): string {
  if (!value) return value ?? ''
  return value.replace(/(^|[\s(\-/"“'‘])(\p{Ll})/gu, (_match, lead: string, letter: string) => lead + letter.toUpperCase())
}

/**
 * A pact title as people should see it: no emoji (older pacts had one stuck
 * on the front), single spaces, Title Case.
 */
export function cleanTitle(value: string | null | undefined): string {
  if (!value) return ''
  const stripped = value
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}‍️⃣]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  return titleCase(stripped || value.trim())
}
