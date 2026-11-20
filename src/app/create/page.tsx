import { CreateEventForm } from "@/components/create-event-form";

export default function CreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create an event</h1>
        <p className="mt-1 text-sm text-stone-600">
          Set up the swap, then share the link from the next page.
        </p>
      </div>
      <CreateEventForm />
    </div>
  );
}
