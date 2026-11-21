import { generateAiGiftIdeas } from "./ai-gifts";
import { GIFT_CATALOG } from "./gift-catalog";
import { suggestGifts, tallyInterests } from "./gift-suggestions";
import { getEvent, listParticipants } from "./store";
import type { GiftEvent, Participant, PollData } from "./types";

/**
 * Computes the gift ideas to save when sign-ups close (or when the organizer
 * regenerates them). Claude writes them when it can; otherwise the built-in
 * algorithm does, so the list is never empty. Returns the fields to merge
 * into the event.
 */
export async function buildGiftIdeas(
  event: Pick<GiftEvent, "budget">,
  participants: Pick<Participant, "interests">[],
  options: { avoidTitles?: string[] } = {},
): Promise<Pick<GiftEvent, "giftIdeas" | "giftIdeasAt" | "giftIdeasSource">> {
  const tally = tallyInterests(participants);
  const aiIdeas = await generateAiGiftIdeas({
    tally,
    budget: event.budget,
    avoidTitles: options.avoidTitles,
  });
  return {
    giftIdeas: aiIdeas ?? suggestGifts(tally, event.budget, GIFT_CATALOG),
    giftIdeasAt: new Date().toISOString(),
    giftIdeasSource: aiIdeas ? "ai" : "algorithm",
  };
}

/**
 * The public view of an event's poll. Built from a whitelist (name and
 * interests only) and never by spreading participant records, so emails and
 * other fields cannot leak. Used by the API route and the join page.
 */
export async function getPoll(eventId: string): Promise<PollData | undefined> {
  const event = await getEvent(eventId);
  if (!event) return undefined;
  const participants = await listParticipants(eventId);
  return {
    people: participants.map((p) => ({ name: p.name, interests: [...p.interests] })),
    tally: tallyInterests(participants),
    // Ideas from an earlier close are stale once sign-ups reopen.
    giftIdeas: event.status === "closed" ? (event.giftIdeas ?? []) : [],
    giftIdeasAt: event.status === "closed" ? event.giftIdeasAt : undefined,
    giftIdeasSource: event.status === "closed" ? event.giftIdeasSource : undefined,
  };
}
