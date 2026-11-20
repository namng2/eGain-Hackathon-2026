import { NextResponse } from "next/server";
import { apiError, parseBody } from "@/lib/api";
import { identitiesMatch } from "@/lib/identity-match";
import { toPublicEvent } from "@/lib/public-event";
import {
  countParticipants,
  getEvent,
  updateEvent,
} from "@/lib/store";
import { updateEventSchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string }> };

/** Public details for anyone with the share link. */
export async function GET(_request: Request, { params }: Context) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) return apiError("Event not found", 404);

  const count = await countParticipants(eventId);
  return NextResponse.json(toPublicEvent(event, count));
}

/** Organizer-only: edit details or open/close sign-ups. */
export async function PATCH(request: Request, { params }: Context) {
  const { eventId } = await params;
  const parsed = await parseBody(request, updateEventSchema);
  if (!parsed.ok) return parsed.response;

  const event = await getEvent(eventId);
  if (!event) return apiError("Event not found", 404);
  if (!identitiesMatch(parsed.data.identity, event.organizer)) {
    return apiError("Only the organizer can change this event", 403);
  }

  const updated = await updateEvent(eventId, parsed.data.changes);
  if (!updated) return apiError("Event not found", 404);

  const count = await countParticipants(eventId);
  return NextResponse.json(toPublicEvent(updated, count));
}
