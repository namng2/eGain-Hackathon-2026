import { NextResponse } from "next/server";
import { apiError, parseBody } from "@/lib/api";
import { loadChatAccess } from "@/lib/chat-access";
import { contactKey } from "@/lib/identity-match";
import { summarizeReactions } from "@/lib/reactions";
import { getMessage, toggleReaction } from "@/lib/store";
import { reactionSchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string; messageId: string }> };

/** Add your emoji reaction to a message, or remove it if you already reacted. */
export async function POST(request: Request, { params }: Context) {
  const { eventId, messageId } = await params;
  const parsed = await parseBody(request, reactionSchema);
  if (!parsed.ok) return parsed.response;

  const access = await loadChatAccess(eventId, parsed.data.identity);
  if ("error" in access) return access.error;

  const message = await getMessage(messageId);
  if (!message || message.eventId !== eventId) {
    return apiError("Message not found", 404);
  }

  const viewerKey = contactKey(access.member);
  const updated = await toggleReaction(messageId, parsed.data.emoji, viewerKey);
  if (!updated) return apiError("Message not found", 404);
  return NextResponse.json({
    reactions: summarizeReactions(updated.reactions, viewerKey),
  });
}
