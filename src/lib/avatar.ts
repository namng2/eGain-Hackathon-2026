/** Profile picture helpers. Pure functions, safe to use in the browser and on the server. */

/** Pictures are shrunk to 256px in the browser first, so 1 MB is generous. */
export const MAX_AVATAR_BYTES = 1024 * 1024;

export function avatarUrl(eventId: string, avatarId: string): string {
  return `/api/events/${eventId}/avatars/${avatarId}`;
}

/** "Ann Lee" gives "AL", "Bob" gives "B". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** A background color for the initials circle. The same name always gets the same color. */
export function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name.trim().toLowerCase()) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }
  // Mid-dark so white text stays readable.
  return `hsl(${hash % 360} 45% 38%)`;
}
