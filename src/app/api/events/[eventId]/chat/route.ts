import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api";
import { loadChatAccess } from "@/lib/chat-access";
import { contactKey } from "@/lib/identity-match";
import { buildAvatarMap, toChatMembers, toPublicMessage } from "@/lib/public-chat";
import { listMessages, listParticipants } from "@/lib/store";
import { identityOnlySchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string }> };

/**
 * Read the chat: the latest messages and who's here, without anyone's email or phone.
 * POST rather than GET so the reader's contact details aren't placed in the URL.
 */
export async function POST(request: Request, { params }: Context) {
  const { eventId } = await params;
  const parsed = await parseBody(request, identityOnlySchema);
  if (!parsed.ok) return parsed.response;

  const access = await loadChatAccess(eventId, parsed.data.identity);
  if ("error" in access) return access.error;

  const [messages, participants] = await Promise.all([
    listMessages(eventId),
    listParticipants(eventId),
  ]);
  const avatars = buildAvatarMap(eventId, participants);
  const viewerKey = contactKey(access.member);
  return NextResponse.json({
    messages: messages.map((m) => toPublicMessage(m, { viewerKey, avatars })),
    members: toChatMembers(access.event.organizer, participants, avatars),
    me: { name: access.member.name, role: access.role },
  });
}
