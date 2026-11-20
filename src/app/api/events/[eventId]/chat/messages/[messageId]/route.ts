import { NextResponse } from "next/server";
import { apiError, parseBody } from "@/lib/api";
import { loadChatAccess } from "@/lib/chat-access";
import { normalizeEmail } from "@/lib/identity-match";
import { deleteChatImage, getMessage, removeMessage } from "@/lib/store";
import { identityOnlySchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string; messageId: string }> };

/** Delete a message. Its author can delete it, and so can the organizer. */
export async function DELETE(request: Request, { params }: Context) {
  const { eventId, messageId } = await params;
  const parsed = await parseBody(request, identityOnlySchema);
  if (!parsed.ok) return parsed.response;

  const access = await loadChatAccess(eventId, parsed.data.identity);
  if ("error" in access) return access.error;

  const message = await getMessage(messageId);
  if (!message || message.eventId !== eventId) {
    return apiError("Message not found", 404);
  }

  const isAuthor =
    normalizeEmail(message.authorEmail) === normalizeEmail(access.member.email);
  if (access.role !== "organizer" && !isAuthor) {
    return apiError("You can only delete your own messages", 403);
  }

  const removed = await removeMessage(messageId);
  if (removed?.image) await deleteChatImage(removed.image.id, removed.image.ext);
  return NextResponse.json({ ok: true });
}
