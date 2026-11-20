import { GIFT_CATALOG } from "./gift-catalog";
import { suggestGifts, tallyInterests } from "./gift-suggestions";
import { getEvent, listParticipants } from "./store";
import type { GiftEvent, Participant, PollData } from "./types";

/**
 * Computes the gift ideas to save when sign-ups close.
 * Returns the fields to merge into the event.
 */
export function buildGiftIdeas(
  event: Pick<GiftEvent, "budget">,
  participants: Pick<Participant, "interests">[],
): Pick<GiftEvent, "giftIdeas" | "giftIdeasAt"> {
  const tally = tallyInterests(participants);
  return {
    giftIdeas: suggestGifts(tally, event.budget, GIFT_CATALOG),
    giftIdeasAt: new Date().toISOString(),
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
  };
}
