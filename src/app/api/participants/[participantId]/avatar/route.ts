import { NextResponse } from "next/server";
import { apiError, parseAvatarForm, parseBody } from "@/lib/api";
import { MAX_AVATAR_BYTES } from "@/lib/avatar";
import { detectImageType } from "@/lib/chat-image";
import { avatarUrl } from "@/lib/avatar";
import { loadParticipantAccess } from "@/lib/participant-access";
import {
  deleteChatImage,
  saveChatImage,
  setParticipantAvatar,
} from "@/lib/store";
import { identityOnlySchema } from "@/lib/validation";

type Context = { params: Promise<{ participantId: string }> };

const TOO_BIG = "That picture is too big. The limit is 1 MB.";

/**
 * Set or replace a profile picture. Multipart form: name, email or phone, image.
 * The person themselves or the organizer may do it. This works even after
 * sign-ups close, because a picture isn't part of the swap.
 */
export async function POST(request: Request, { params }: Context) {
  const { participantId } = await params;

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_AVATAR_BYTES + 64 * 1024) return apiError(TOO_BIG, 413);

  const parsed = await parseAvatarForm(request);
  if (!parsed.ok) return parsed.response;

  const access = await loadParticipantAccess(participantId, parsed.identity);
  if ("error" in access) return access.error;

  const { image } = parsed;
  if (!image) return apiError("Choose a picture.", 400);
  if (image.size > MAX_AVATAR_BYTES) return apiError(TOO_BIG, 413);

  const bytes = new Uint8Array(await image.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) {
    return apiError("Only JPEG, PNG, GIF, or WebP pictures can be used.", 400);
  }

  const previous = access.participant.avatar;
  const id = await saveChatImage(bytes, type.ext);
  const updated = await setParticipantAvatar(participantId, { id, ext: type.ext });
  if (!updated) {
    await deleteChatImage(id, type.ext).catch(() => {});
    return apiError("Entry not found", 404);
  }
  // The old file is no longer used by anyone.
  if (previous) await deleteChatImage(previous.id, previous.ext).catch(() => {});

  return NextResponse.json({ avatarUrl: avatarUrl(updated.eventId, id) });
}

/** Remove a profile picture. */
export async function DELETE(request: Request, { params }: Context) {
  const { participantId } = await params;
  const parsed = await parseBody(request, identityOnlySchema);
  if (!parsed.ok) return parsed.response;

  const access = await loadParticipantAccess(participantId, parsed.data.identity);
  if ("error" in access) return access.error;

  const previous = access.participant.avatar;
  if (previous) {
    await setParticipantAvatar(participantId, undefined);
    await deleteChatImage(previous.id, previous.ext).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
