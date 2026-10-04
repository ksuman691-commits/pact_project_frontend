// Same 7 categories the Create Pact flow and TopNav's filter chips use (see
// TopNav.tsx's CATEGORIES) — reused here so a pact's hero placeholder (shown
// when it has no proof photo yet) gets a color/emoji that matches the rest
// of the app's category vocabulary instead of a generic gray box.
const CATEGORY_THEME: Record<string, { gradient: string; emoji: string }> = {
  fitness: { gradient: 'var(--navy)', emoji: '💪' },
  startup: { gradient: 'var(--navy)', emoji: '🚀' },
  habits: { gradient: 'var(--navy)', emoji: '🔥' },
  social: { gradient: 'var(--navy)', emoji: '🎉' },
  creator: { gradient: 'var(--navy)', emoji: '🎨' },
  study: { gradient: 'var(--navy)', emoji: '🧠' },
  coding: { gradient: 'var(--navy)', emoji: '💻' },
};

const DEFAULT_THEME = { gradient: 'var(--navy)', emoji: '✨' };

/** Case-insensitive lookup — pact.category values vary in casing across the API. */
export function getCategoryTheme(category?: string | null) {
  if (!category) return DEFAULT_THEME;
  return CATEGORY_THEME[category.toLowerCase()] ?? DEFAULT_THEME;
}
