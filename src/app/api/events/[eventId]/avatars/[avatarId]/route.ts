import { apiError } from "@/lib/api";
import { imageTypeForExt, isImageId } from "@/lib/chat-image";
import { imageResponse } from "@/lib/image-response";
import { listParticipants, readChatImage } from "@/lib/store";

type Context = { params: Promise<{ eventId: string; avatarId: string }> };

/**
 * Serves a profile picture. An <img> tag can't send a name and email, so the
 * unguessable id is the key. It only works for a picture that belongs to a
 * participant of this event, and ids are only handed to people in the chat.
 */
export async function GET(_request: Request, { params }: Context) {
  const { eventId, avatarId } = await params;
  if (!isImageId(avatarId)) return apiError("Picture not found", 404);

  const participants = await listParticipants(eventId);
  const avatar = participants.find((p) => p.avatar?.id === avatarId)?.avatar;
  const type = avatar ? imageTypeForExt(avatar.ext) : null;
  if (!avatar || !type) return apiError("Picture not found", 404);

  const bytes = await readChatImage(avatarId, avatar.ext);
  if (!bytes) return apiError("Picture not found", 404);
  return imageResponse(bytes, type.mime);
}
