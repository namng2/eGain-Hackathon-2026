"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { toCsv } from "@/lib/csv";
import { callApi } from "@/lib/client-api";
import { errorText } from "@/lib/errors";
import {
  attendanceLabel,
  formatBudget,
  formatDateTime,
  formatEventDate,
  formatJoinedDate,
} from "@/lib/format";
import type { Identity, Participant, PollData, PublicEvent } from "@/lib/types";
import { CopyLinkButton } from "./copy-link-button";
import { EventFields, eventFromForm } from "./event-fields";
import { IdentityGate } from "./identity-gate";
import { PollPanel } from "./poll-panel";
import { Alert, Button, Card, StatusBadge, buttonClasses, inputClass } from "./ui";

type Roster = { event: PublicEvent; participants: Participant[] };
type Notice = { tone: "success" | "error"; text: string };

export function ManageEvent({ eventId }: { eventId: string }) {
  return (
    <IdentityGate
      title="Organizer sign-in"
      description="Enter the name and email you used to create this event. There's no password yet."
    >
      {(identity, forget) => (
        <ManageView eventId={eventId} identity={identity} onForget={forget} />
      )}
    </IdentityGate>
  );
}

// Reads the page's origin on the client only, so the share link is complete.
function subscribeNothing() {
  return () => {};
}
function useOrigin() {
  return useSyncExternalStore(
    subscribeNothing,
    () => window.location.origin,
    () => "",
  );
}

function ManageView({
  eventId,
  identity,
  onForget,
}: {
  eventId: string;
  identity: Identity;
  onForget: () => void;
}) {
  const origin = useOrigin();
  const [roster, setRoster] = useState<Roster | null>(null);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let active = true;
    callApi<Roster>(`/api/events/${eventId}/roster`, { body: { identity } }).then(
      (data) => {
        if (active) {
          setRoster(data);
          setLoadError(null);
        }
      },
      (err: unknown) => {
        if (active) setLoadError(errorText(err));
      },
    );
    callApi<PollData>(`/api/events/${eventId}/poll`, { method: "GET" }).then(
      (data) => {
        if (active) setPoll(data);
      },
      () => {
        // The poll is a bonus on this page. The roster error above is the one to show.
      },
    );
    return () => {
      active = false;
    };
  }, [eventId, identity, version]);

  async function saveChanges(changes: Record<string, unknown>, successText: string) {
    setBusy(true);
    setNotice(null);
    try {
      await callApi(`/api/events/${eventId}`, {
        method: "PATCH",
        body: { identity, changes },
      });
      reload();
      setNotice({ tone: "success", text: successText });
    } catch (err) {
      setNotice({ tone: "error", text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  async function removeParticipant(participant: Participant) {
    if (!window.confirm(`Remove ${participant.name} from this event? This can't be undone.`)) {
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await callApi(`/api/participants/${participant.id}`, {
        method: "DELETE",
        body: { identity },
      });
      reload();
      setNotice({ tone: "success", text: `${participant.name} was removed.` });
    } catch (err) {
      setNotice({ tone: "error", text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    if (!roster) return;
    const rows = [
      ["Name", "Email or phone", "Department", "Attendance", "Interests", "Gift hint", "Joined"],
      ...roster.participants.map((p) => [
        p.name,
        p.email || p.phone,
        p.department,
        attendanceLabel(p.attendance),
        p.interests.join(", "),
        p.giftTeaser,
        p.joinedAt,
      ]),
    ];
    const blob = new Blob(["﻿" + toCsv(rows)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const slug =
      roster.event.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "event";
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-participants.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loadError) {
    return (
      <Alert tone="error">
        <p>{loadError}</p>
        <Button variant="secondary" onClick={onForget} className="mt-3">
          Use a different name or contact
        </Button>
      </Alert>
    );
  }
  if (!roster) return <p className="text-sm text-stone-500">Loading event…</p>;

  const { event, participants } = roster;
  const shareUrl = `${origin}/join/${eventId}`;
  const nextStatus = event.status === "open" ? "closed" : "open";

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-green-800">{event.companyName}</p>
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          </div>
          <StatusBadge status={event.status} />
        </div>
        <p className="mt-3 text-sm text-stone-600">
          {formatEventDate(event.date)} · {event.location} · Budget{" "}
          {formatBudget(event.budget)} · Steal limit {event.stealLimit}
        </p>
        <p className="mt-3 text-sm text-stone-600">
          Signed in as <strong className="text-stone-900">{identity.name}</strong> (
          {identity.email || identity.phone}).{" "}
          <button
            type="button"
            onClick={onForget}
            className="font-medium text-green-800 underline underline-offset-2"
          >
            Not you?
          </button>
        </p>
      </Card>

      {notice ? (
        <Alert tone={notice.tone === "error" ? "error" : "success"}>{notice.text}</Alert>
      ) : null}

      <Card>
        <h2 className="font-semibold">Share this link</h2>
        <p className="mt-1 text-sm text-stone-600">
          Send it to everyone in the company. They can sign up and edit their own
          entry from it.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className={`${inputClass} mt-0 font-mono text-xs`}
          />
          <CopyLinkButton value={shareUrl} />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Sign-ups</h2>
            <p className="mt-1 text-sm text-stone-600">
              {participants.length} {participants.length === 1 ? "person" : "people"}{" "}
              signed up.{" "}
              {event.status === "open"
                ? "New people can still join."
                : "New sign-ups and edits are turned off."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                saveChanges(
                  { status: nextStatus },
                  nextStatus === "closed" ? "Sign-ups are closed." : "Sign-ups are open again.",
                )
              }
            >
              {event.status === "open" ? "Close sign-ups" : "Reopen sign-ups"}
            </Button>
            <Link
              href={`/events/${eventId}/chat`}
              className={buttonClasses("secondary")}
            >
              Group chat
            </Link>
            <Button
              variant="secondary"
              onClick={exportCsv}
              disabled={participants.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {poll ? (
        <PollPanel
          poll={poll}
          note={
            poll.giftIdeasAt
              ? `Generated when sign-ups closed on ${formatDateTime(poll.giftIdeasAt)}.`
              : undefined
          }
        />
      ) : null}
      {event.status === "open" ? (
        <p className="-mt-3 text-sm text-stone-500">
          Gift ideas are generated from the poll when you close sign-ups.
        </p>
      ) : null}

      <Card>
        <h2 className="font-semibold">Event details</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            void saveChanges(eventFromForm(new FormData(e.currentTarget)), "Event details saved.");
          }}
        >
          <EventFields
            defaults={{
              name: event.name,
              companyName: event.companyName,
              date: event.date,
              location: event.location,
              budget: event.budget,
              stealLimit: event.stealLimit,
              rules: event.rules,
            }}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              Save details
            </Button>
          </div>
        </form>
      </Card>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4 sm:px-6">
          <h2 className="font-semibold">Participants</h2>
        </div>
        {participants.length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone-500 sm:px-6">
            No one has signed up yet. Share the link above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email or phone</th>
                  <th className="px-4 py-2 font-medium">Department</th>
                  <th className="px-4 py-2 font-medium">Attendance</th>
                  <th className="px-4 py-2 font-medium">Interests</th>
                  <th className="px-4 py-2 font-medium">Gift hint</th>
                  <th className="px-4 py-2 font-medium">Joined</th>
                  <th className="px-4 py-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">{p.name}</td>
                    <td className="break-all px-4 py-3 text-stone-600">{p.email || p.phone}</td>
                    <td className="px-4 py-3">{p.department ?? "—"}</td>
                    <td className="px-4 py-3">{attendanceLabel(p.attendance)}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {p.interests.length > 0 ? p.interests.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{p.giftTeaser ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-500">
                      {formatJoinedDate(p.joinedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() => removeParticipant(p)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
