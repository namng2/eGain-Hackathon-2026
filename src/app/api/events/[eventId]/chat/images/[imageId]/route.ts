import { apiError } from "@/lib/api";
import { imageTypeForExt, isImageId } from "@/lib/chat-image";
import { imageResponse } from "@/lib/image-response";
import { findMessageByImage, readChatImage } from "@/lib/store";

type Context = { params: Promise<{ eventId: string; imageId: string }> };

/**
 * Serves a chat image. An <img> tag can't send a name and email, so the
 * unguessable image id is what unlocks it. Ids are only handed to people who
 * passed the chat check, and the image must belong to this event's chat.
 */
export async function GET(_request: Request, { params }: Context) {
  const { eventId, imageId } = await params;
  if (!isImageId(imageId)) return apiError("Image not found", 404);

  const message = await findMessageByImage(eventId, imageId);
  const type = message?.image ? imageTypeForExt(message.image.ext) : null;
  if (!message?.image || !type) return apiError("Image not found", 404);

  const bytes = await readChatImage(imageId, message.image.ext);
  if (!bytes) return apiError("Image not found", 404);
  return imageResponse(bytes, type.mime);
}
