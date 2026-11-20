"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { callApi } from "@/lib/client-api";
import { errorText } from "@/lib/errors";
import { useIdentity } from "@/lib/use-identity";
import type { Identity } from "@/lib/types";
import { EventFields, eventFromForm } from "./event-fields";
import { Alert, Button, Card, Field, inputClass } from "./ui";

export function CreateEventForm() {
  const { identity, ready, setIdentity } = useIdentity();
  if (!ready) return <p className="text-sm text-stone-500">Loading…</p>;
  return <CreateForm initial={identity} onOrganizerSaved={setIdentity} />;
}

function CreateForm({
  initial,
  onOrganizerSaved,
}: {
  initial: Identity | null;
  onOrganizerSaved: (identity: Identity) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const organizer = {
      name: String(form.get("organizerName") ?? ""),
      email: String(form.get("organizerEmail") ?? ""),
    };

    setBusy(true);
    setError(null);
    try {
      const { id } = await callApi<{ id: string }>("/api/events", {
        body: { organizer, ...eventFromForm(form) },
      });
      onOrganizerSaved({ name: organizer.name.trim(), email: organizer.email.trim() });
      router.push(`/events/${id}/manage`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h2 className="font-semibold">You, the organizer</h2>
        <p className="mt-1 text-sm text-stone-600">
          You&apos;ll use this name and email to manage the event.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input
              name="organizerName"
              required
              defaultValue={initial?.name}
              autoComplete="name"
              maxLength={80}
              className={inputClass}
            />
          </Field>
          <Field label="Your email">
            <input
              name="organizerEmail"
              type="email"
              required
              defaultValue={initial?.email}
              autoComplete="email"
              maxLength={200}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">The event</h2>
        <div className="mt-4">
          <EventFields />
        </div>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create event"}
        </Button>
      </div>
    </form>
  );
}
