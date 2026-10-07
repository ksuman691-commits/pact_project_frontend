// Same 7 categories the Create Pact flow and TopNav's filter chips use (see
// TopNav.tsx's CATEGORIES) — reused here so a pact's hero placeholder (shown
// when it has no proof photo yet) gets a color/emoji that matches the rest
// of the app's category vocabulary instead of a generic gray box.
const CATEGORY_THEME: Record<string, { color: string; emoji: string }> = {
  fitness: { color: 'var(--navy)', emoji: '💪' },
  startup: { color: 'var(--navy)', emoji: '🚀' },
  habits: { color: 'var(--navy)', emoji: '🔥' },
  social: { color: 'var(--navy)', emoji: '🎉' },
  creator: { color: 'var(--navy)', emoji: '🎨' },
  study: { color: 'var(--navy)', emoji: '🧠' },
  coding: { color: 'var(--navy)', emoji: '💻' },
};

const DEFAULT_THEME = { color: 'var(--navy)', emoji: '✨' };

/** Case-insensitive lookup — pact.category values vary in casing across the API. */
export function getCategoryTheme(category?: string | null) {
  if (!category) return DEFAULT_THEME;
  return CATEGORY_THEME[category.toLowerCase()] ?? DEFAULT_THEME;
}
