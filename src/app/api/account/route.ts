import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api";
import { identitiesMatch } from "@/lib/identity-match";
import { toPublicEvent } from "@/lib/public-event";
import {
  countParticipants,
  listEventsByOrganizer,
  listParticipationsByContact,
} from "@/lib/store";
import type { AccountSummary } from "@/lib/types";
import { identityOnlySchema } from "@/lib/validation";

/** Events this person organizes and events they have joined. */
export async function POST(request: Request) {
  const parsed = await parseBody(request, identityOnlySchema);
  if (!parsed.ok) return parsed.response;
  const { identity } = parsed.data;

  const organizedEvents = identity.email
    ? (await listEventsByOrganizer(identity.email)).filter((event) =>
        identitiesMatch(identity, event.organizer),
      )
    : [];
  const participations = (
    await listParticipationsByContact(identity)
  ).filter(({ participant }) => identitiesMatch(identity, participant));

  const summary: AccountSummary = {
    organizing: await Promise.all(
      organizedEvents.map(async (event) =>
        toPublicEvent(event, await countParticipants(event.id)),
      ),
    ),
    joined: await Promise.all(
      participations.map(async ({ participant, event }) => ({
        participant,
        event: toPublicEvent(event, await countParticipants(event.id)),
      })),
    ),
  };

  return NextResponse.json(summary);
}
