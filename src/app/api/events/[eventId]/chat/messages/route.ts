import { NextResponse } from "next/server";
import { apiError, parseMessageForm } from "@/lib/api";
import { loadChatAccess } from "@/lib/chat-access";
import { MAX_IMAGE_BYTES, detectImageType } from "@/lib/chat-image";
import { buildAvatarMap, toPublicMessage } from "@/lib/public-chat";
import {
  addMessage,
  deleteChatImage,
  listParticipants,
  saveChatImage,
} from "@/lib/store";

type Context = { params: Promise<{ eventId: string }> };

// Room for the text fields and form framing on top of the largest image.
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

/**
 * Post a message. Sent as multipart form data: name, email, text, and an
 * optional image. A message needs text, an image, or both.
 */
export async function POST(request: Request, { params }: Context) {
  const { eventId } = await params;

  // Turn away oversized uploads before reading them into memory.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return apiError("That image is too big. The limit is 5 MB.", 413);
  }

  const parsed = await parseMessageForm(request);
  if (!parsed.ok) return parsed.response;
  const { data, image } = parsed;

  const access = await loadChatAccess(eventId, data.identity);
  if ("error" in access) return access.error;

  if (!data.text && !image) {
    return apiError("Write a message or add an image.", 400);
  }

  let stored: { id: string; ext: string } | undefined;
  if (image) {
    if (image.size > MAX_IMAGE_BYTES) {
      return apiError("That image is too big. The limit is 5 MB.", 413);
    }
    const bytes = new Uint8Array(await image.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) {
      return apiError("Only JPEG, PNG, GIF, or WebP images can be sent.", 400);
    }
    stored = { id: await saveChatImage(bytes, type.ext), ext: type.ext };
  }

  try {
    const message = await addMessage({
      eventId,
      authorName: access.member.name,
      authorEmail: access.member.email,
      text: data.text,
      image: stored,
    });
    const avatars = buildAvatarMap(eventId, await listParticipants(eventId));
    return NextResponse.json(
      {
        message: toPublicMessage(message, {
          viewerEmail: access.member.email,
          avatars,
        }),
      },
      { status: 201 },
    );
  } catch (err) {
    // Don't leave an orphaned file behind if the message couldn't be saved.
    if (stored) await deleteChatImage(stored.id, stored.ext).catch(() => {});
    throw err;
  }
}
