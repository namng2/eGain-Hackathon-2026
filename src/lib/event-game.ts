/**
 * Builds a white elephant game from an event's sign-ups. Pure: no storage.
 */
import { startGame } from "./game";
import type { GameState, Participant, PublicEvent } from "./types";

/** Fewest sign-ups needed before an organizer can start the game. */
export const MIN_GAME_PLAYERS = 3;

export const MYSTERY_GIFT = "A mystery gift";

export function gameFromRoster(
  event: Pick<PublicEvent, "id" | "stealLimit">,
  participants: Pick<Participant, "id" | "gift">[],
  random?: () => number,
): GameState {
  return startGame({
    eventId: event.id,
    playerIds: participants.map((p) => p.id),
    gifts: participants.map((p) => ({
      id: `gift-${p.id}`,
      contributorId: p.id,
      name: p.gift?.trim() || MYSTERY_GIFT,
    })),
    stealLimit: event.stealLimit,
    random,
  });
}
