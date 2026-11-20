import { NextResponse } from "next/server";
import { apiError, parseBody } from "@/lib/api";
import { identitiesMatch } from "@/lib/identity-match";
import type { Identity } from "@/lib/types";
import {
  getEvent,
  getParticipant,
  removeParticipant,
  updateParticipant,
} from "@/lib/store";
import {
  identityOnlySchema,
  updateParticipantSchema,
} from "@/lib/validation";

type Context = { params: Promise<{ participantId: string }> };

/**
 * A participant can change or leave their own entry. The organizer can
 * change or remove anyone's entry.
 */
async function loadAccess(participantId: string, identity: Identity) {
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
  return { event, isOrganizer } as const;
}

export async function PATCH(request: Request, { params }: Context) {
  const { participantId } = await params;
  const parsed = await parseBody(request, updateParticipantSchema);
  if (!parsed.ok) return parsed.response;

  const access = await loadAccess(participantId, parsed.data.identity);
  if ("error" in access) return access.error;
  if (!access.isOrganizer && access.event.status === "closed") {
    return apiError("Sign-ups are closed for this event.", 409);
  }

  const updated = await updateParticipant(participantId, parsed.data.changes);
  if (!updated) return apiError("Entry not found", 404);
  return NextResponse.json({ participant: updated });
}

/** Leave an event (participant) or remove someone (organizer). */
export async function DELETE(request: Request, { params }: Context) {
  const { participantId } = await params;
  const parsed = await parseBody(request, identityOnlySchema);
  if (!parsed.ok) return parsed.response;

  const access = await loadAccess(participantId, parsed.data.identity);
  if ("error" in access) return access.error;

  await removeParticipant(participantId);
  return NextResponse.json({ ok: true });
}
