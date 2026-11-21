/**
 * Emoji reactions on chat messages. Pure functions, no I/O.
 * Each person can add each emoji once per message; reacting again removes it.
 */

export const REACTION_EMOJIS = ["👍", "😂", "🎁", "🔥", "❤️"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** Emoji to the normalized emails of the people who used it. */
export type Reactions = Record<string, string[]>;

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return (REACTION_EMOJIS as readonly string[]).includes(value);
}

const clean = (email: string) => email.trim().toLowerCase();

/** Returns a new reactions object with this person's reaction toggled. */
export function toggleReactionIn(
  reactions: Reactions | undefined,
  emoji: string,
  email: string,
): Reactions {
  const who = clean(email);
  const next: Reactions = { ...(reactions ?? {}) };
  const current = next[emoji] ?? [];
  const updated = current.includes(who)
    ? current.filter((e) => e !== who)
    : [...current, who];
  if (updated.length > 0) next[emoji] = updated;
  else delete next[emoji];
  return next;
}

/** Counts per emoji in a fixed order, and whether the viewer reacted. No emails. */
export function summarizeReactions(
  reactions: Reactions | undefined,
  viewerEmail: string,
): { emoji: string; count: number; mine: boolean }[] {
  const viewer = clean(viewerEmail);
  return REACTION_EMOJIS.flatMap((emoji) => {
    const who = reactions?.[emoji] ?? [];
    return who.length > 0
      ? [{ emoji, count: who.length, mine: who.includes(viewer) }]
      : [];
  });
}
