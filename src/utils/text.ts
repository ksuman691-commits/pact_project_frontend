/**
 * Truncate text to a maximum length with ellipsis
 * "This is a very long text" → "This is a very..."
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Get user initials from a name
 * "John Doe" → "JD"
 * "Alice" → "A"
 * "" → "?"
 */
export function getInitials(name: string): string {
  if (!name || !name.trim()) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Capitalize first letter of a string
 * "hello world" → "Hello world"
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert a string to a URL-safe slug
 * "My Awesome Pact" → "my-awesome-pact"
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

/**
 * Highlight matching text in a string
 * highlightText("Hello World", "world") → "Hello <mark>World</mark>"
 * Useful for search results
 */
export function highlightText(text: string, query: string): { plain: string; highlighted: string } {
  if (!query || !text) return { plain: text, highlighted: text };
  
  const regex = new RegExp(`(${query})`, 'gi');
  const highlighted = text.replace(regex, '<mark>$1</mark>');
  
  return { plain: text, highlighted };
}

/**
 * Extract hashtags from text
 * "Check out #awesome #pact" → ["awesome", "pact"]
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#\w+/g);
  return matches ? matches.map(tag => tag.slice(1)) : [];
}

/**
 * Extract mentions from text
 * "Hey @john, check this @jane" → ["john", "jane"]
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/@\w+/g);
  return matches ? matches.map(mention => mention.slice(1)) : [];
}

/**
 * Count words in text
 * "Hello world test" → 3
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Check if text is empty or whitespace only
 */
export function isEmpty(text: string): boolean {
  return !text || !text.trim();
}
