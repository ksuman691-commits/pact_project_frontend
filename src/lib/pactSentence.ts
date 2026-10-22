import { titleCase } from '@/lib/titleCase'

/**
 * Reads a plain sentence ("run 5 km every morning for 30 days") into the
 * pieces a pact needs. Anything it can't find is left for the person to tap.
 */
export type Frequency = 'Every day' | 'Every morning' | 'Every night' | 'Weekdays' | 'Every week'
export type BackendCategory = 'fitness' | 'startup' | 'coding' | 'creator' | 'study' | 'habits' | 'social'

export interface ParsedSentence {
  days: number | null
  frequency: Frequency | null
  category: BackendCategory
  categoryLabel: string
}

const CATEGORY_RULES: [RegExp, BackendCategory, string][] = [
  [/\b(run|ran|gym|walk|km|yoga|workout|steps|swim|cycle|push ?ups?|squats?|lift|fit)/, 'fitness', 'Fitness'],
  [/\b(code|coding|leetcode|github|program|commit)/, 'coding', 'Coding'],
  [/\b(read|pages|book|study|learn|course|practice|language|exam)/, 'study', 'Learning'],
  [/\b(post|reel|video|youtube|write|blog|draw|paint|design|create|podcast|content|photo)/, 'creator', 'Create'],
  [/\b(ship|launch|startup|customers?|revenue|sell|sales|build|business|pitch|save|₹|invest|money)/, 'startup', 'Build & Money'],
  [/\b(meet|call|friends?|people|family|date|network|speak|stage)/, 'social', 'Social'],
]

export function parseSentence(text: string): ParsedSentence {
  const t = (text || '').toLowerCase()
  let days: number | null = null
  const d = t.match(/(\d+)\s*(day|days|night|nights)\b/)
  if (d) days = parseInt(d[1], 10)
  const w = t.match(/(\d+)\s*(week|weeks)\b/)
  if (!days && w) days = parseInt(w[1], 10) * 7
  const m = t.match(/(\d+)\s*(month|months)\b/)
  if (!days && m) days = parseInt(m[1], 10) * 30
  if (days != null && (days < 1 || days > 365)) days = null

  let frequency: Frequency | null = null
  if (/every\s*morning|each morning|mornings/.test(t)) frequency = 'Every morning'
  else if (/every\s*(night|evening)|each night|nightly/.test(t)) frequency = 'Every night'
  else if (/weekday/.test(t)) frequency = 'Weekdays'
  else if (/every\s*week|weekly|a week|per week/.test(t)) frequency = 'Every week'
  else if (/every\s*day|daily|a day|each day|per day/.test(t)) frequency = 'Every day'

  const rule = CATEGORY_RULES.find(([pattern]) => pattern.test(t))
  return { days, frequency, category: rule ? rule[1] : 'habits', categoryLabel: rule ? rule[2] : 'Habits' }
}

/** "run 5 km every morning" + 30 -> "Run 5 Km Every Morning In 30 Days". */
export function sentenceTitle(text: string, days: number): string {
  const clean = text.trim().replace(/\s+/g, ' ').replace(/^i will\s+/i, '').replace(/[.!]+$/, '')
  const hasLength = /(\d+)\s*(day|days|night|nights|week|weeks|month|months)\b/i.test(clean)
  return titleCase(hasLength ? clean : `${clean} in ${days} days`)
}

export const IDEAS = [
  'run 5 km every morning for 30 days',
  'read 20 pages every night for 21 days',
  'post one reel a day for 30 days',
  'save ₹500 every day for 60 days',
  'wake up at 6 every day for 14 days',
  'ship one thing every week for 8 weeks',
]
