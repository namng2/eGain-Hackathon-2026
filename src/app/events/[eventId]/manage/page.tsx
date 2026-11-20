import { Suspense } from "react";
import { ManageEvent } from "@/components/manage-event";

type Props = { params: Promise<{ eventId: string }> };

/** Organizer dashboard. The page itself is public, but data needs the organizer's name + email. */
export default function ManagePage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
      <ManageLoader params={params} />
    </Suspense>
  );
}

async function ManageLoader({ params }: Props) {
  const { eventId } = await params;
  return <ManageEvent eventId={eventId} />;
}
