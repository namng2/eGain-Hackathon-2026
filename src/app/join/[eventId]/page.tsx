import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventSummary } from "@/components/event-summary";
import { JoinForm } from "@/components/join-form";
import { PollPanel } from "@/components/poll-panel";
import { Card } from "@/components/ui";
import { getPoll } from "@/lib/poll";
import { toPublicEvent } from "@/lib/public-event";
import { countParticipants, getEvent } from "@/lib/store";

type Props = { params: Promise<{ eventId: string }> };

/** The share link. Anyone with the URL can see the event and sign up. */
export default function JoinPage({ params }: Props) {
  return (
    <Suspense fallback={<JoinSkeleton />}>
      <JoinContent params={params} />
    </Suspense>
  );
}

async function JoinContent({ params }: Props) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();

  const publicEvent = toPublicEvent(event, await countParticipants(eventId));
  const poll = await getPoll(eventId);
  return (
    <div className="space-y-6">
      <EventSummary event={publicEvent} />
      <JoinForm event={publicEvent} />
      {poll ? <PollPanel poll={poll} /> : null}
    </div>
  );
}

function JoinSkeleton() {
  return (
    <Card>
      <p className="text-sm text-stone-500">Loading event…</p>
    </Card>
  );
}
