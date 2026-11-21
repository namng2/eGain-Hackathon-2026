"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { nanoid } from "nanoid";
import { Alert, Button, Card, Field, inputClass } from "@/components/ui";
import {
  BUDGETS,
  STEAL_LIMIT,
  applyMove,
  movesFor,
  newLobby,
  startGame,
  type Budget,
  type PartyGame,
  type PartyPlayer,
} from "@/lib/party-game";

const MIN_PLAYERS = 3;

function storageKey(code: string) {
  return `white-elephant-party:${code}`;
}

function loadGame(code: string): PartyGame {
  try {
    const raw = localStorage.getItem(storageKey(code));
    if (raw) return JSON.parse(raw) as PartyGame;
  } catch {
    // Corrupt or unavailable storage: start with a fresh lobby.
  }
  return newLobby();
}

/**
 * Party page UI. This is a single-device prototype: state lives in this browser,
 * so everyone plays on one screen. Real multi-phone play needs the server side.
 */
export function PartyBoard({ code }: { code: string }) {
  // False on the server and during hydration, true once in the browser.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Card>
        <p className="text-sm text-stone-500">Loading party…</p>
      </Card>
    );
  }
  return <PartyGameView key={code} code={code} />;
}

function noopSubscribe() {
  return () => {};
}

function PartyGameView({ code }: { code: string }) {
  const [game, setGame] = useState<PartyGame>(() => loadGame(code));

  function commit(next: PartyGame) {
    setGame(next);
    localStorage.setItem(storageKey(code), JSON.stringify(next));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
          Party {code}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {game.phase === "lobby"
            ? "Add the players"
            : game.phase === "playing"
              ? "Unwrap and steal"
              : "Round over"}
        </h1>
      </div>

      {game.phase === "lobby" ? (
        <Lobby game={game} commit={commit} />
      ) : (
        <Round game={game} commit={commit} />
      )}
    </div>
  );
}

function Lobby({
  game,
  commit,
}: {
  game: PartyGame;
  commit: (next: PartyGame) => void;
}) {
  const allConfirmed =
    game.players.length >= MIN_PLAYERS && game.players.every((p) => p.confirmed);

  function setPlayers(players: PartyPlayer[]) {
    commit({ ...game, players });
  }

  function toggleConfirm(id: string) {
    setPlayers(
      game.players.map((p) => (p.id === id ? { ...p, confirmed: !p.confirmed } : p)),
    );
  }

  function remove(id: string) {
    setPlayers(game.players.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <AddPlayerForm
        onAdd={(player) => setPlayers([...game.players, player])}
      />

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Players</h2>
          <span className="text-sm text-stone-500">
            {game.players.filter((p) => p.confirmed).length} of {game.players.length}{" "}
            confirmed
          </span>
        </div>

        {game.players.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No one has joined yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-200">
            {game.players.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="truncate text-sm text-stone-600">
                    {p.interests} · up to ${p.budget}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.confirmed
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {p.confirmed ? "Confirmed" : "Waiting"}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => toggleConfirm(p.id)}
                >
                  {p.confirmed ? "Edit" : "Confirm"}
                </Button>
                <Button variant="danger" onClick={() => remove(p.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="space-y-3">
        {!allConfirmed ? (
          <p className="text-sm text-stone-600">
            Start unlocks when at least {MIN_PLAYERS} people are in and everyone has
            confirmed.
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button
            disabled={!allConfirmed}
            onClick={() => commit(startGame(game.players))}
          >
            Start the round
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddPlayerForm({ onAdd }: { onAdd: (player: PartyPlayer) => void }) {
  const [name, setName] = useState("");
  const [interests, setInterests] = useState("");
  const [budget, setBudget] = useState<Budget>(25);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !interests.trim()) {
      setError("Add a name and at least one interest.");
      return;
    }
    setError(null);
    onAdd({
      id: nanoid(8),
      name: name.trim().replace(/\s+/g, " "),
      interests: interests.trim(),
      budget,
      confirmed: false,
    });
    setName("");
    setInterests("");
  }

  return (
    <Card>
      <h2 className="font-semibold">Add a player</h2>
      <p className="mt-1 text-sm text-stone-600">
        Interests are what the gift is built from. Separate them with commas.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className={inputClass}
            />
          </Field>
          <Field label="Interests">
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="coffee, hiking, board games"
              maxLength={300}
              className={inputClass}
            />
          </Field>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-800">Budget</legend>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={budget === value}
                onClick={() => setBudget(value)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors ${
                  budget === value
                    ? "bg-green-700 text-white ring-green-700"
                    : "bg-white text-stone-800 ring-stone-300 hover:bg-stone-50"
                }`}
              >
                ${value}
              </button>
            ))}
          </div>
        </fieldset>

        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="flex justify-end">
          <Button type="submit">Add player</Button>
        </div>
      </form>
    </Card>
  );
}

function Round({
  game,
  commit,
}: {
  game: PartyGame;
  commit: (next: PartyGame) => void;
}) {
  const playing = game.phase === "playing";
  const current = game.order[game.turn];
  const currentName =
    game.players.find((p) => p.id === current)?.name ?? "Someone";
  const moves = playing ? movesFor(game, current) : [];
  const nameOf = (id: string | null) =>
    game.players.find((p) => p.id === id)?.name ?? "Someone";

  return (
    <div className="space-y-6">
      {playing ? (
        <Alert tone="info">
          <p className="font-semibold">{currentName}&apos;s turn</p>
          <p className="mt-1">{game.message}</p>
        </Alert>
      ) : (
        <Alert tone="success">
          <p className="font-semibold">Everyone has a gift.</p>
          <p className="mt-1">{game.message}</p>
        </Alert>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {game.gifts.map((gift) => {
          const move = moves.find((m) => m.giftId === gift.id);
          const revealed = gift.opened || !playing;
          return (
            <li key={gift.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">
                    {revealed ? gift.title : "Wrapped gift"}
                  </p>
                  {gift.locked ? (
                    <span className="shrink-0 rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                      Locked
                    </span>
                  ) : null}
                </div>

                {revealed ? (
                  <p className="mt-2 text-sm text-stone-600">{gift.description}</p>
                ) : null}

                <p className="mt-3 text-xs text-stone-500">
                  {gift.holderId
                    ? `Held by ${nameOf(gift.holderId)} · ${gift.steals}/${STEAL_LIMIT} steals`
                    : "Not picked up yet"}
                </p>
                {!playing ? (
                  <p className="mt-1 text-xs text-stone-500">
                    Inspired by {nameOf(gift.originId)} · ${gift.price}
                  </p>
                ) : null}

                {move ? (
                  <div className="mt-4">
                    <Button
                      onClick={() =>
                        commit(applyMove(game, { type: move.type, giftId: gift.id }))
                      }
                    >
                      {move.type === "unwrap"
                        ? "Unwrap"
                        : `Steal from ${nameOf(gift.holderId)}`}
                    </Button>
                  </div>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={() =>
            commit({
              ...newLobby(
                game.players.map((p) => ({ ...p, confirmed: false })),
              ),
            })
          }
        >
          Back to the lobby
        </Button>
      </div>
    </div>
  );
}
