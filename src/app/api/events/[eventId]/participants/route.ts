import { NextResponse } from "next/server";
import { apiError, parseBody } from "@/lib/api";
import { getEvent, StoreConflictError, upsertParticipant } from "@/lib/store";
import { joinEventSchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string }> };

/**
 * Sign up for an event. If the same name + email already signed up, the
 * existing entry is updated (created: false) instead of duplicated.
 */
export async function POST(request: Request, { params }: Context) {
  const { eventId } = await params;
  const parsed = await parseBody(request, joinEventSchema);
  if (!parsed.ok) return parsed.response;

  const event = await getEvent(eventId);
  if (!event) return apiError("Event not found", 404);
  if (event.status === "closed") {
    return apiError("Sign-ups are closed for this event.", 409);
  }

  try {
    const { participant, created } = await upsertParticipant(
      eventId,
      parsed.data,
    );
    return NextResponse.json(
      { participant, created },
      { status: created ? 201 : 200 },
    );
  } catch (err) {
    if (err instanceof StoreConflictError) return apiError(err.message, 409);
    throw err;
  }
}
