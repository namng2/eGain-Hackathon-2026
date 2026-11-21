"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isValidEmail, isValidPhone, parseContact } from "@/lib/identity-match";
import { useIdentity } from "@/lib/use-identity";
import type { Identity } from "@/lib/types";
import { Alert, Button, Card, Field, inputClass } from "./ui";

/** Pulls the event ID out of a share link like https://example.com/join/k3x9p2qa. */
function eventIdFromLink(raw: string): string | null {
  const match = raw.trim().match(/\/join\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export function JoinEventForm() {
  const { identity, ready, setIdentity } = useIdentity();
  if (!ready) return <p className="text-sm text-stone-500">Loading…</p>;
  return <JoinForm initial={identity} onSaved={setIdentity} />;
}

function JoinForm({
  initial,
  onSaved,
}: {
  initial: Identity | null;
  onSaved: (identity: Identity) => void;
}) {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [name, setName] = useState(initial?.name ?? "");
  const [contact, setContact] = useState(
    initial?.email || initial?.phone || "",
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const eventId = eventIdFromLink(link);
    if (!eventId) {
      setError("Paste the event link, the one that contains /join/.");
      return;
    }
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Enter your full name.");
      return;
    }
    const { email, phone } = parseContact(contact);
    if (!email && !phone) {
      setError("Enter an email address or phone number.");
      return;
    }
    if (email && !isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    setError(null);
    onSaved({ name: cleanName, email, phone });
    router.push(`/join/${eventId}`);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Event link"
          hint="The link the organizer sent you."
        >
          <input
            required
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://.../join/k3x9p2qa"
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={80}
              className={inputClass}
            />
          </Field>
          <Field label="Email or phone number">
            <input
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              autoComplete="email"
              inputMode="email"
              maxLength={200}
              className={inputClass}
            />
          </Field>
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="flex justify-end">
          <Button type="submit">Continue to sign up</Button>
        </div>
      </form>
    </Card>
  );
}
