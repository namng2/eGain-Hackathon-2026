/**
 * Emoji reactions on chat messages. Pure functions, no I/O.
 * Each person can add each emoji once per message; reacting again removes it.
 */

export const REACTION_EMOJIS = ["👍", "😂", "🎁", "🔥", "❤️"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** Emoji to the contact keys (see contactKey) of the people who used it. */
export type Reactions = Record<string, string[]>;

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return (REACTION_EMOJIS as readonly string[]).includes(value);
}

const clean = (key: string) => key.trim().toLowerCase();

/** Returns a new reactions object with this person's reaction toggled. */
export function toggleReactionIn(
  reactions: Reactions | undefined,
  emoji: string,
  personKey: string,
): Reactions {
  const who = clean(personKey);
  const next: Reactions = { ...(reactions ?? {}) };
  const current = next[emoji] ?? [];
  const updated = current.includes(who)
    ? current.filter((e) => e !== who)
    : [...current, who];
  if (updated.length > 0) next[emoji] = updated;
  else delete next[emoji];
  return next;
}

/** Counts per emoji in a fixed order, and whether the viewer reacted. No contact details. */
export function summarizeReactions(
  reactions: Reactions | undefined,
  viewerKey: string,
): { emoji: string; count: number; mine: boolean }[] {
  const viewer = clean(viewerKey);
  return REACTION_EMOJIS.flatMap((emoji) => {
    const who = reactions?.[emoji] ?? [];
    return who.length > 0
      ? [{ emoji, count: who.length, mine: who.includes(viewer) }]
      : [];
  });
}
