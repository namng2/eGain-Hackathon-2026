"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { callApi } from "@/lib/client-api";
import { errorText } from "@/lib/errors";
import { MIN_GAME_PLAYERS, gameFromRoster } from "@/lib/event-game";
import { GameRuleError, applyMove } from "@/lib/game";
import type { GameMove, GameState, Identity, Participant, PublicEvent } from "@/lib/types";
import { IdentityGate } from "../identity-gate";
import { Alert, Button, Card, buttonClasses } from "../ui";
import { Round } from "./party-board";

type Roster = { event: PublicEvent; participants: Participant[] };

/**
 * The game for one event, played by the organizer on one screen for everyone.
 * Players and gifts come from the event's sign-ups. The game is saved in this
 * browser, so reloading the page picks up where it left off.
 */
export function EventGame({ eventId }: { eventId: string }) {
  return (
    <IdentityGate
      title="Organizer sign-in"
      description="Enter the name and email you used to create this event. Only the organizer can run the game."
    >
      {(identity, forget) => (
        <EventGameLoader eventId={eventId} identity={identity} onForget={forget} />
      )}
    </IdentityGate>
  );
}

function EventGameLoader({
  eventId,
  identity,
  onForget,
}: {
  eventId: string;
  identity: Identity;
  onForget: () => void;
}) {
  const [roster, setRoster] = useState<Roster | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    callApi<Roster>(`/api/events/${eventId}/roster`, { body: { identity } }).then(
      (data) => {
        if (active) setRoster(data);
      },
      (err: unknown) => {
        if (active) setLoadError(errorText(err));
      },
    );
    return () => {
      active = false;
    };
  }, [eventId, identity]);

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
  if (!roster) return <p className="text-sm text-stone-500">Loading game…</p>;

  if (roster.participants.length < MIN_GAME_PLAYERS) {
    return (
      <Card>
        <h1 className="text-2xl font-bold tracking-tight">{roster.event.name}</h1>
        <p className="mt-2 text-sm text-stone-600">
          The game needs at least {MIN_GAME_PLAYERS} sign-ups. So far{" "}
          {roster.participants.length} {roster.participants.length === 1 ? "person has" : "people have"}{" "}
          signed up.
        </p>
        <Link href={`/events/${eventId}/manage`} className={buttonClasses("secondary", "mt-4")}>
          Back to dashboard
        </Link>
      </Card>
    );
  }

  return <EventGameBoard event={roster.event} participants={roster.participants} />;
}

function storageKey(eventId: string) {
  return `white-elephant-game:event:${eventId}`;
}

function loadSavedGame(eventId: string): GameState | null {
  try {
    const raw = localStorage.getItem(storageKey(eventId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as GameState;
    return saved.eventId === eventId ? saved : null;
  } catch {
    return null;
  }
}

function samePlayers(game: GameState, participants: Participant[]): boolean {
  const ids = participants.map((p) => p.id).sort();
  const players = [...game.turnOrder].sort();
  return ids.length === players.length && ids.every((id, i) => id === players[i]);
}

function EventGameBoard({
  event,
  participants,
}: {
  event: PublicEvent;
  participants: Participant[];
}) {
  const [game, setGame] = useState<GameState>(
    () => loadSavedGame(event.id) ?? gameFromRoster(event, participants),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(event.id), JSON.stringify(game));
    } catch {
      // Storage can be blocked. The game still works until the page is closed.
    }
  }, [event.id, game]);

  function makeMove(move: GameMove) {
    try {
      setGame(applyMove(game, move));
      setError(null);
    } catch (err) {
      setError(err instanceof GameRuleError ? err.message : errorText(err));
    }
  }

  function restart() {
    if (!window.confirm("Restart the game? Everyone's gifts go back to wrapped, and the turn order is reshuffled.")) {
      return;
    }
    setGame(gameFromRoster(event, participants));
    setError(null);
  }

  const players = participants.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
          {event.name}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {game.phase === "finished" ? "Round over" : "Unwrap and steal"}
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          {participants.length} players · each gift can be stolen {game.stealLimit}{" "}
          {game.stealLimit === 1 ? "time" : "times"} before it freezes
        </p>
      </div>

      {!samePlayers(game, participants) ? (
        <Alert tone="info">
          The sign-up list changed since this game started. Restart the game to include
          everyone who&apos;s signed up now.
        </Alert>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Round
        game={game}
        players={players}
        onMove={makeMove}
        actions={
          <>
            <Button variant="secondary" onClick={restart}>
              Restart game
            </Button>
            <Link href={`/events/${event.id}/manage`} className={buttonClasses("secondary")}>
              Back to dashboard
            </Link>
          </>
        }
      />
    </div>
  );
}
