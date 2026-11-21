import { apiError } from "./api";
import { identitiesMatch } from "./identity-match";
import { getEvent, listParticipants } from "./store";
import type { ChatRole, Identity } from "./types";

/**
 * Who may use an event's chat: the organizer and everyone signed up, matched
 * by name + email or phone like the rest of the app. This is not real authentication.
 *
 * On success, `member` carries the stored name, email and phone, so messages
 * show the name as the person signed up with it, not however they typed it today.
 */
export async function loadChatAccess(eventId: string, identity: Identity) {
  const event = await getEvent(eventId);
  if (!event) return { error: apiError("Event not found", 404) } as const;

  if (identitiesMatch(identity, event.organizer)) {
    return {
      event,
      role: "organizer" as ChatRole,
      member: event.organizer,
    } as const;
  }

  const participants = await listParticipants(eventId);
  const participant = participants.find((p) => identitiesMatch(identity, p));
  if (participant) {
    return {
      event,
      role: "participant" as ChatRole,
      member: {
        name: participant.name,
        email: participant.email,
        phone: participant.phone ?? "",
      },
    } as const;
  }

  return {
    error: apiError(
      "Only people signed up for this event can use its chat.",
      403,
    ),
  } as const;
}
