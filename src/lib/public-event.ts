import type { GiftEvent, PublicEvent } from "./types";

/** Strips the organizer's email before an event leaves the server. */
export function toPublicEvent(
  event: GiftEvent,
  participantCount: number,
): PublicEvent {
  const { organizer, ...rest } = event;
  return {
    ...rest,
    organizerName: organizer.name,
    participantCount,
  };
}
