/**
 * Capitalises the first letter of every word, leaving the rest of each word
 * alone (so "5km", "UPI" and "iPhone"-style words aren't flattened).
 * "Sleep early 20 nights in 30 Days" -> "Sleep Early 20 Nights In 30 Days".
 */
export function titleCase(value: string | null | undefined): string {
  if (!value) return value ?? ''
  return value.replace(/(^|[\s(\-/"“'‘])(\p{Ll})/gu, (_match, lead: string, letter: string) => lead + letter.toUpperCase())
}
