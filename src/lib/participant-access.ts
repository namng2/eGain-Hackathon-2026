import { apiError } from "./api";
import { identitiesMatch } from "./identity-match";
import { getEvent, getParticipant } from "./store";
import type { Identity } from "./types";

/**
 * A participant can change or leave their own entry. The organizer can
 * change or remove anyone's entry. Shared by the participant routes.
 */
export async function loadParticipantAccess(
  participantId: string,
  identity: Identity,
) {
  const participant = await getParticipant(participantId);
  if (!participant) {
    return { error: apiError("Entry not found", 404) } as const;
  }
  const event = await getEvent(participant.eventId);
  if (!event) return { error: apiError("Event not found", 404) } as const;

  const isOrganizer = identitiesMatch(identity, event.organizer);
  const isSelf = identitiesMatch(identity, participant);
  if (!isOrganizer && !isSelf) {
    return { error: apiError("You can only change your own entry", 403) } as const;
  }
  return { participant, event, isOrganizer } as const;
}
