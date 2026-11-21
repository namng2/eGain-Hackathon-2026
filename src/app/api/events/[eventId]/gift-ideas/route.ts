import { NextResponse } from "next/server";
import { apiError, parseBody } from "@/lib/api";
import { identitiesMatch } from "@/lib/identity-match";
import { buildGiftIdeas } from "@/lib/poll";
import { getEvent, listParticipants, updateEvent } from "@/lib/store";
import { identityOnlySchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string }> };

// Each regenerate can cost an API call, so a stuck click or a script can't spam it.
const COOLDOWN_MS = 10_000;
const globalForCooldown = globalThis as typeof globalThis & {
  __whiteElephantRegenerated?: Map<string, number>;
};

/**
 * Organizer-only: write a fresh set of gift ideas (Claude when available,
 * otherwise the algorithm) from the current poll. Only after sign-ups close.
 * POST so the organizer's email isn't placed in the URL.
 */
export async function POST(request: Request, { params }: Context) {
  const { eventId } = await params;
  const parsed = await parseBody(request, identityOnlySchema);
  if (!parsed.ok) return parsed.response;

  const event = await getEvent(eventId);
  if (!event) return apiError("Event not found", 404);
  if (!identitiesMatch(parsed.data.identity, event.organizer)) {
    return apiError("Only the organizer can regenerate gift ideas", 403);
  }
  if (event.status !== "closed") {
    return apiError(
      "Close sign-ups first. Gift ideas are made when sign-ups close.",
      409,
    );
  }

  const last = (globalForCooldown.__whiteElephantRegenerated ??= new Map());
  const wait = (last.get(eventId) ?? 0) + COOLDOWN_MS - Date.now();
  if (wait > 0) {
    return NextResponse.json(
      { error: "Please wait a few seconds before regenerating." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(wait / 1000)) } },
    );
  }
  last.set(eventId, Date.now());

  const participants = await listParticipants(eventId);
  const generated = await buildGiftIdeas(event, participants, {
    avoidTitles: event.giftIdeas?.map((idea) => idea.title),
  });
  const updated = await updateEvent(eventId, generated);
  if (!updated) return apiError("Event not found", 404);

  return NextResponse.json({
    giftIdeas: updated.giftIdeas ?? [],
    giftIdeasAt: updated.giftIdeasAt,
    giftIdeasSource: updated.giftIdeasSource,
  });
}
