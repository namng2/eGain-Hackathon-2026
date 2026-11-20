"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { attendanceLabel } from "@/lib/format";
import { callApi } from "@/lib/client-api";
import { errorText } from "@/lib/errors";
import { parseContact } from "@/lib/identity-match";
import { useIdentity } from "@/lib/use-identity";
import type { Attendance, Identity, Participant, PublicEvent } from "@/lib/types";
import { Alert, Button, Card, Field, buttonClasses, inputClass } from "./ui";

export function JoinForm({ event }: { event: PublicEvent }) {
  const { identity, ready, setIdentity } = useIdentity();

  if (event.status === "closed") {
    return (
      <Alert tone="info">
        Sign-ups are closed for this event. Ask the organizer if you still need to join.
      </Alert>
    );
  }
  if (!ready) {
    return (
      <Card>
        <p className="text-sm text-stone-500">Loading form…</p>
      </Card>
    );
  }
  return (
    <SignUpForm eventId={event.id} initial={identity} onSaved={setIdentity} />
  );
}

function SignUpForm({
  eventId,
  initial,
  onSaved,
}: {
  eventId: string;
  initial: Identity | null;
  onSaved: (identity: Identity) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [contact, setContact] = useState(
    initial?.email || initial?.phone || "",
  );
  const [department, setDepartment] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("in_person");
  const [interests, setInterests] = useState("");
  const [giftTeaser, setGiftTeaser] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<boolean | null>(null);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { email, phone } = parseContact(contact);
    try {
      const data = await callApi<{ participant: Participant; created: boolean }>(
        `/api/events/${eventId}/participants`,
        {
          body: {
            name,
            email,
            phone,
            department,
            attendance,
            interests,
            giftTeaser,
          },
        },
      );
      onSaved({ name: name.trim(), email, phone });
      setCreated(data.created);
      // Re-run the server parts of this page so the sign-up count is current.
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (created !== null) {
    return (
      <Card>
        <Alert tone="success">
          <p className="font-semibold">
            {created ? "You're in!" : "Your entry is updated."}
          </p>
          <p className="mt-1">
            {created
              ? "You're on the list. You can change your details any time from your account page."
              : "You were already signed up, so we updated your details."}
          </p>
        </Alert>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/account" className={buttonClasses("secondary")}>
            Go to my account
          </Link>
          <Button variant="secondary" onClick={() => setCreated(null)}>
            Change my details
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Sign up</h2>
      <p className="mt-1 text-sm text-stone-600">
        Use the same name and email or phone each time. That&apos;s how we know it&apos;s you.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
          <Field label="Department (optional)">
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              maxLength={80}
              className={inputClass}
            />
          </Field>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-800">Attendance</legend>
          <div className="flex flex-wrap gap-5">
            {(["in_person", "remote"] as const).map((value) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm text-stone-800"
              >
                <input
                  type="radio"
                  name="attendance"
                  value={value}
                  checked={attendance === value}
                  onChange={() => setAttendance(value)}
                  className="h-4 w-4 accent-green-700"
                />
                {attendanceLabel(value)}
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label="Interests"
          hint="What you like, separated by commas. Your gift is written from this."
        >
          <textarea
            required
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="coffee, hiking, board games"
            className={inputClass}
          />
        </Field>

        <Field
          label="Gift hint (optional)"
          hint="A short hint about your gift. The organizer can see it."
        >
          <input
            value={giftTeaser}
            onChange={(e) => setGiftTeaser(e.target.value)}
            maxLength={200}
            className={inputClass}
          />
        </Field>

        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? "Signing up…" : "Sign up"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
