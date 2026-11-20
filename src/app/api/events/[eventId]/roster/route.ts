import { NextResponse } from "next/server";
import { apiError, parseBody } from "@/lib/api";
import { identitiesMatch } from "@/lib/identity-match";
import { toPublicEvent } from "@/lib/public-event";
import { getEvent, listParticipants } from "@/lib/store";
import { identityOnlySchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string }> };

/**
 * Organizer-only: the full participant list, including emails.
 * POST rather than GET so the organizer's email isn't placed in the URL.
 */
export async function POST(request: Request, { params }: Context) {
  const { eventId } = await params;
  const parsed = await parseBody(request, identityOnlySchema);
  if (!parsed.ok) return parsed.response;

  const event = await getEvent(eventId);
  if (!event) return apiError("Event not found", 404);
  if (!identitiesMatch(parsed.data.identity, event.organizer)) {
    return apiError(
      "These name and email details don't match this event's organizer.",
      403,
    );
  }

  const participants = await listParticipants(eventId);
  return NextResponse.json({
    event: toPublicEvent(event, participants.length),
    participants,
  });
}
