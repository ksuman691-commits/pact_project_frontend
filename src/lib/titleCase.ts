/**
 * Capitalises the first letter of every word, leaving the rest of each word
 * alone (so "5km", "UPI" and "iPhone"-style words aren't flattened).
 * "Sleep early 20 nights in 30 Days" -> "Sleep Early 20 Nights In 30 Days".
 */
// Units stay lower case after a number: "Run 5 km", not "Run 5 Km".
const UNITS = new Set(['km', 'kms', 'k', 'm', 'mi', 'kg', 'kgs', 'g', 'lb', 'lbs', 'l', 'ml', 'min', 'mins', 'h', 'hr', 'hrs', 'am', 'pm', 'cm', 'x', 'cal', 'kcal'])

export function titleCase(value: string | null | undefined): string {
  if (!value) return value ?? ''
  return value.replace(/(^|[\s(\-/"“'‘])(\p{Ll})(\p{L}*)/gu, (match, lead: string, letter: string, rest: string, offset: number, whole: string) => {
    const word = (letter + rest).toLowerCase()
    if (UNITS.has(word) && /\d\s*$/.test(whole.slice(0, offset + lead.length))) return match
    return lead + letter.toUpperCase() + rest
  })
}

/**
 * A pact title as people should see it: as they typed it, minus emoji (older
 * pacts had one stuck on the front) and extra spaces. No forced capitals.
 */
export function cleanTitle(value: string | null | undefined): string {
  if (!value) return ''
  const stripped = value
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}‍️⃣]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped || value.trim()
}
