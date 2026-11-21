import { NextResponse } from "next/server";
import { apiError, parseBody } from "@/lib/api";
import { identitiesMatch } from "@/lib/identity-match";
import { buildGiftIdeas } from "@/lib/poll";
import { toPublicEvent } from "@/lib/public-event";
import {
  countParticipants,
  getEvent,
  listParticipants,
  updateEvent,
  type EventChanges,
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

  // Closing sign-ups turns the interests poll into gift ideas. Closing again
  // after a reopen regenerates them from the latest answers.
  const changes: EventChanges = { ...parsed.data.changes };
  if (changes.status === "closed") {
    const participants = await listParticipants(eventId);
    Object.assign(
      changes,
      await buildGiftIdeas({ budget: changes.budget ?? event.budget }, participants),
    );
  }

  const updated = await updateEvent(eventId, changes);
  if (!updated) return apiError("Event not found", 404);

  const count = await countParticipants(eventId);
  return NextResponse.json(toPublicEvent(updated, count));
}
