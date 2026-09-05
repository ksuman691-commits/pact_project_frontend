// Same 7 categories the Create Pact flow and TopNav's filter chips use (see
// TopNav.tsx's CATEGORIES) — reused here so a pact's hero placeholder (shown
// when it has no proof photo yet) gets a color/emoji that matches the rest
// of the app's category vocabulary instead of a generic gray box.
const CATEGORY_THEME: Record<string, { gradient: string; emoji: string }> = {
  fitness: { gradient: 'linear-gradient(135deg, #22c55e, #0ea5e9)', emoji: '💪' },
  startup: { gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', emoji: '🚀' },
  habits: { gradient: 'linear-gradient(135deg, #f97316, #ef4444)', emoji: '🔥' },
  social: { gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', emoji: '🎉' },
  creator: { gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)', emoji: '🎨' },
  study: { gradient: 'linear-gradient(135deg, #14b8a6, #0ea5e9)', emoji: '🧠' },
  coding: { gradient: 'linear-gradient(135deg, #64748b, #334155)', emoji: '💻' },
};

const DEFAULT_THEME = { gradient: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', emoji: '✨' };

/** Case-insensitive lookup — pact.category values vary in casing across the API. */
export function getCategoryTheme(category?: string | null) {
  if (!category) return DEFAULT_THEME;
  return CATEGORY_THEME[category.toLowerCase()] ?? DEFAULT_THEME;
}
