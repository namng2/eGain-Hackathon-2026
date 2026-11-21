import { Suspense } from "react";
import { EventGame } from "@/components/party/event-game";

type Props = { params: Promise<{ eventId: string }> };

/** The white elephant game for one event. The organizer runs it on one screen. */
export default function EventGamePage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
      <GameLoader params={params} />
    </Suspense>
  );
}

async function GameLoader({ params }: Props) {
  const { eventId } = await params;
  return <EventGame eventId={eventId} />;
}
