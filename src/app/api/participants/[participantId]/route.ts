import { NextResponse } from "next/server";
import { apiError, parseBody } from "@/lib/api";
import { deleteChatImage, removeParticipant, updateParticipant } from "@/lib/store";
import { loadParticipantAccess } from "@/lib/participant-access";
import {
  identityOnlySchema,
  updateParticipantSchema,
} from "@/lib/validation";

type Context = { params: Promise<{ participantId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { participantId } = await params;
  const parsed = await parseBody(request, updateParticipantSchema);
  if (!parsed.ok) return parsed.response;

  const access = await loadParticipantAccess(participantId, parsed.data.identity);
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

  const access = await loadParticipantAccess(participantId, parsed.data.identity);
  if ("error" in access) return access.error;

  await removeParticipant(participantId);
  // Don't leave their profile picture behind on disk.
  const { avatar } = access.participant;
  if (avatar) await deleteChatImage(avatar.id, avatar.ext).catch(() => {});
  return NextResponse.json({ ok: true });
}
