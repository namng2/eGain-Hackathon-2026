import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api";
import { loadChatAccess } from "@/lib/chat-access";
import { toPublicMessage } from "@/lib/public-chat";
import { listMessages } from "@/lib/store";
import { identityOnlySchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string }> };

/**
 * Read the chat: the latest messages, without anyone's email.
 * POST rather than GET so the reader's email isn't placed in the URL.
 */
export async function POST(request: Request, { params }: Context) {
  const { eventId } = await params;
  const parsed = await parseBody(request, identityOnlySchema);
  if (!parsed.ok) return parsed.response;

  const access = await loadChatAccess(eventId, parsed.data.identity);
  if ("error" in access) return access.error;

  const messages = await listMessages(eventId);
  return NextResponse.json({
    messages: messages.map(toPublicMessage),
    me: { name: access.member.name, role: access.role },
  });
}
