/**
 * Turns the interests poll into gift suggestions. Pure functions, no I/O, so
 * they are easy to check on their own.
 */
import type { CatalogGift } from "./gift-catalog";
import type { GiftIdea, InterestCount } from "./types";

const TALLY_SIZE = 10;
const IDEA_COUNT = 6;

/** Trim, lowercase, and collapse spaces, so "Coffee " and "coffee" are one interest. */
export function normalizeInterest(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Counts each interest once per person and returns the most common ones. */
export function tallyInterests(
  participants: { interests: string[] }[],
): InterestCount[] {
  const counts = new Map<string, number>();
  for (const person of participants) {
    const seen = new Set(person.interests.map(normalizeInterest).filter(Boolean));
    for (const interest of seen) {
      counts.set(interest, (counts.get(interest) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([interest, count]) => ({ interest, count }))
    .sort((a, b) => b.count - a.count || a.interest.localeCompare(b.interest))
    .slice(0, TALLY_SIZE);
}

// "hike" and "hikes" should match; this is deliberately light, not stemming.
function sameTopic(interest: string, tag: string): boolean {
  const strip = (s: string) => s.replace(/s$/, "");
  return interest === tag || strip(interest) === strip(tag);
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toIdea(gift: CatalogGift, matchedInterests: string[]): GiftIdea {
  return {
    id: slug(gift.title),
    title: gift.title,
    emoji: gift.emoji,
    priceLabel: `$${gift.priceUsd}`,
    priceUsd: gift.priceUsd,
    searchQuery: gift.searchQuery,
    matchedInterests,
  };
}

/**
 * Picks up to 6 gifts within budget, best match first. A gift scores the sum of
 * the poll counts of the interests it matches. If nothing matches, the
 * cheapest in-budget gifts are returned so the list is never empty.
 */
export function suggestGifts(
  tally: InterestCount[],
  budget: number,
  catalog: CatalogGift[],
): GiftIdea[] {
  const affordable = catalog.filter((g) => g.priceUsd <= budget);

  const scored = affordable
    .map((gift) => {
      const matches = tally.filter(({ interest }) =>
        gift.interests.some((tag) => sameTopic(interest, tag)),
      );
      return {
        gift,
        score: matches.reduce((sum, m) => sum + m.count, 0),
        matched: matches.map((m) => m.interest),
      };
    })
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.gift.priceUsd - b.gift.priceUsd ||
        a.gift.title.localeCompare(b.gift.title),
    );

  if (scored.length > 0) {
    return scored.slice(0, IDEA_COUNT).map((s) => toIdea(s.gift, s.matched));
  }
  return [...affordable]
    .sort((a, b) => a.priceUsd - b.priceUsd || a.title.localeCompare(b.title))
    .slice(0, IDEA_COUNT)
    .map((gift) => toIdea(gift, []));
}
