"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { callApi } from "@/lib/client-api";
import { errorText } from "@/lib/errors";
import { attendanceLabel, formatEventDate } from "@/lib/format";
import type { AccountSummary, Identity, Participant, PublicEvent } from "@/lib/types";
import { IdentityGate } from "./identity-gate";
import { InterestPicker } from "./interest-picker";
import {
  Alert,
  Button,
  Card,
  EmptyNote,
  Field,
  StatusBadge,
  buttonClasses,
  inputClass,
} from "./ui";

export function AccountView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My account</h1>
        <p className="mt-1 text-sm text-stone-600">
          The events you organize and the events you&apos;ve joined.
        </p>
      </div>
      <IdentityGate
        title="Find my events"
        description="Enter the name and email you used to sign up or create an event. There's no password yet, so anyone who knows these details can see this account."
      >
        {(identity, forget) => (
          <AccountDetails identity={identity} onForget={forget} />
        )}
      </IdentityGate>
    </div>
  );
}

function AccountDetails({
  identity,
  onForget,
}: {
  identity: Identity;
  onForget: () => void;
}) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let active = true;
    callApi<AccountSummary>("/api/account", { body: { identity } }).then(
      (data) => {
        if (active) {
          setSummary(data);
          setError(null);
        }
      },
      (err: unknown) => {
        if (active) setError(errorText(err));
      },
    );
    return () => {
      active = false;
    };
  }, [identity, version]);

  if (error) {
    return (
      <Alert tone="error">
        <p>{error}</p>
        <Button variant="secondary" onClick={onForget} className="mt-3">
          Use a different name and email
        </Button>
      </Alert>
    );
  }
  if (!summary) {
    return <p className="text-sm text-stone-500">Loading your events…</p>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <p className="text-sm text-stone-600">
          Signed in as <strong className="text-stone-900">{identity.name}</strong> (
          {identity.email}).{" "}
          <button
            type="button"
            onClick={onForget}
            className="font-medium text-emerald-800 underline underline-offset-2"
          >
            Not you?
          </button>
        </p>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Events I&apos;m organizing</h2>
        {summary.organizing.length === 0 ? (
          <EmptyNote>
            You haven&apos;t created an event yet.{" "}
            <Link href="/create" className="font-medium text-emerald-800 underline">
              Create one
            </Link>
            .
          </EmptyNote>
        ) : (
          summary.organizing.map((event) => (
            <OrganizerCard key={event.id} event={event} />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Events I&apos;ve joined</h2>
        {summary.joined.length === 0 ? (
          <EmptyNote>
            You haven&apos;t joined any events yet. Open a share link to sign up.
          </EmptyNote>
        ) : (
          summary.joined.map(({ participant, event }) => (
            <JoinedCard
              key={participant.id}
              identity={identity}
              participant={participant}
              event={event}
              onChanged={reload}
            />
          ))
        )}
      </section>
    </div>
  );
}

function OrganizerCard({ event }: { event: PublicEvent }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-800">{event.companyName}</p>
          <h3 className="font-semibold">{event.name}</h3>
          <p className="mt-1 text-sm text-stone-600">
            {formatEventDate(event.date)} · {event.location}
          </p>
        </div>
        <StatusBadge status={event.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">{event.participantCount} signed up</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/events/${event.id}/chat`}
            className={buttonClasses("secondary")}
          >
            Group chat
          </Link>
          <Link
            href={`/events/${event.id}/manage`}
            className={buttonClasses("secondary")}
          >
            Manage event
          </Link>
        </div>
      </div>
    </Card>
  );
}

function JoinedCard({
  identity,
  participant,
  event,
  onChanged,
}: {
  identity: Identity;
  participant: Participant;
  event: PublicEvent;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [interests, setInterests] = useState<string[]>(participant.interests);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = event.status === "closed";

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await callApi(`/api/participants/${participant.id}`, {
        method: "PATCH",
        body: {
          identity,
          changes: {
            department: String(form.get("department") ?? ""),
            attendance: String(form.get("attendance") ?? "in_person"),
            giftTeaser: String(form.get("giftTeaser") ?? ""),
            interests,
          },
        },
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!window.confirm(`Leave ${event.name}? Your entry will be removed.`)) return;
    setBusy(true);
    setError(null);
    try {
      await callApi(`/api/participants/${participant.id}`, {
        method: "DELETE",
        body: { identity },
      });
      onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-800">{event.companyName}</p>
          <h3 className="font-semibold">{event.name}</h3>
          <p className="mt-1 text-sm text-stone-600">
            {formatEventDate(event.date)} · {event.location}
          </p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <p className="mt-3 text-sm text-stone-600">
        You&apos;re signed up · {attendanceLabel(participant.attendance)}
        {participant.department ? ` · ${participant.department}` : ""}
      </p>
      {participant.giftTeaser ? (
        <p className="mt-1 text-sm text-stone-600">Gift hint: {participant.giftTeaser}</p>
      ) : null}
      {participant.interests.length > 0 ? (
        <p className="mt-1 text-sm text-stone-600">
          Interests: {participant.interests.join(", ")}
        </p>
      ) : null}

      {error ? (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      {editing ? (
        <form
          onSubmit={save}
          className="mt-4 space-y-4 border-t border-stone-200 pt-4"
        >
          <Field label="Department (optional)">
            <input
              name="department"
              defaultValue={participant.department}
              maxLength={80}
              className={inputClass}
            />
          </Field>
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
                    defaultChecked={participant.attendance === value}
                    className="h-4 w-4 accent-emerald-700"
                  />
                  {attendanceLabel(value)}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Gift hint (optional)">
            <input
              name="giftTeaser"
              defaultValue={participant.giftTeaser}
              maxLength={200}
              className={inputClass}
            />
          </Field>
          <InterestPicker value={interests} onChange={setInterests} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              Save changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-500">
            {locked ? "Sign-ups are closed, so your entry is locked." : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/events/${event.id}/chat`}
              className={buttonClasses("secondary")}
            >
              Group chat
            </Link>
            <Button
              variant="secondary"
              disabled={locked || busy}
              onClick={() => {
                setInterests(participant.interests);
                setEditing(true);
              }}
            >
              Edit
            </Button>
            <Button variant="danger" disabled={busy} onClick={leave}>
              Leave event
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
