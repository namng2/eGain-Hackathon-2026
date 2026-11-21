import { JoinEventForm } from "@/components/join-event-form";

export default function JoinEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Join an event</h1>
        <p className="mt-1 text-sm text-stone-600">
          Paste the event link from the organizer, then tell us who you are. You&apos;ll
          add your interests on the next page.
        </p>
      </div>
      <JoinEventForm />
    </div>
  );
}
