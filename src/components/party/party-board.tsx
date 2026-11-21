"use client";

import { useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { nanoid } from "nanoid";
import { Alert, Button, Card, Field, inputClass } from "@/components/ui";
import {
  GameRuleError,
  applyMove,
  getAvailableMoves,
  startGame,
  toPlayerView,
} from "@/lib/game";
import type { GameMove, GameState } from "@/lib/types";

const MIN_PLAYERS = 3;
const STEAL_LIMIT = 3;

type LobbyPlayer = { id: string; name: string; gift: string };
type PartyState = { players: LobbyPlayer[]; game: GameState | null };

function storageKey(code: string) {
  return `white-elephant-game:${code}`;
}

function loadState(code: string): PartyState {
  try {
    const raw = localStorage.getItem(storageKey(code));
    if (raw) return JSON.parse(raw) as PartyState;
  } catch {
    // Corrupt or unavailable storage: start with an empty lobby.
  }
  return { players: [], game: null };
}

function errorText(err: unknown): string {
  return err instanceof GameRuleError ? err.message : "Something went wrong.";
}

function PartyLoading() {
  return (
    <Card>
      <p className="text-sm text-stone-500">Loading party…</p>
    </Card>
  );
}

/**
 * Party page UI. This is a single-device prototype: state lives in this browser,
 * so everyone plays on one screen. The rules come from src/lib/game.ts.
 *
 * The board reads localStorage, so it is rendered only in the browser. The
 * server and the first browser render both show the loading card, which keeps
 * hydration consistent.
 */
const ClientPartyGame = dynamic(() => Promise.resolve(PartyGameView), {
  ssr: false,
  loading: () => <PartyLoading />,
});

export function PartyBoard({ code }: { code: string }) {
  return <ClientPartyGame key={code} code={code} />;
}

function PartyGameView({ code }: { code: string }) {
  const [state, setState] = useState<PartyState>(() => loadState(code));
  const [error, setError] = useState<string | null>(null);

  function save(next: PartyState) {
    setState(next);
    localStorage.setItem(storageKey(code), JSON.stringify(next));
  }

  function start() {
    try {
      const game = startGame({
        eventId: code,
        playerIds: state.players.map((p) => p.id),
        gifts: state.players.map((p) => ({
          id: `gift-${p.id}`,
          contributorId: p.id,
          name: p.gift,
        })),
        stealLimit: STEAL_LIMIT,
      });
      save({ ...state, game });
      setError(null);
    } catch (err) {
      setError(errorText(err));
    }
  }

  function makeMove(move: GameMove) {
    if (!state.game) return;
    try {
      save({ ...state, game: applyMove(state.game, move) });
      setError(null);
    } catch (err) {
      setError(errorText(err));
    }
  }

  const game = state.game;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
          Party {code}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {!game
            ? "Add the players"
            : game.phase === "finished"
              ? "Round over"
              : "Unwrap and steal"}
        </h1>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {game ? (
        <Round
          game={game}
          players={state.players}
          onMove={makeMove}
          onBackToLobby={() => save({ players: state.players, game: null })}
        />
      ) : (
        <Lobby
          players={state.players}
          onChange={(players) => save({ ...state, players })}
          onStart={start}
        />
      )}
    </div>
  );
}

function Lobby({
  players,
  onChange,
  onStart,
}: {
  players: LobbyPlayer[];
  onChange: (players: LobbyPlayer[]) => void;
  onStart: () => void;
}) {
  const canStart = players.length >= MIN_PLAYERS;

  return (
    <div className="space-y-6">
      <AddPlayerForm onAdd={(player) => onChange([...players, player])} />

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Players</h2>
          <span className="text-sm text-stone-500">
            {players.length} joined · gifts stay hidden until unwrapped
          </span>
        </div>

        {players.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No one has joined yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-200">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <p className="min-w-0 flex-1 font-medium">{p.name}</p>
                <Button
                  variant="danger"
                  onClick={() => onChange(players.filter((x) => x.id !== p.id))}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="space-y-3">
        {!canStart ? (
          <p className="text-sm text-stone-600">
            Start unlocks when at least {MIN_PLAYERS} people have joined.
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button disabled={!canStart} onClick={onStart}>
            Start the round
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddPlayerForm({ onAdd }: { onAdd: (player: LobbyPlayer) => void }) {
  const [name, setName] = useState("");
  const [gift, setGift] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !gift.trim()) {
      setError("Add a name and the gift you're bringing.");
      return;
    }
    setError(null);
    onAdd({
      id: nanoid(8),
      name: name.trim().replace(/\s+/g, " "),
      gift: gift.trim(),
    });
    setName("");
    setGift("");
  }

  return (
    <Card>
      <h2 className="font-semibold">Add a player</h2>
      <p className="mt-1 text-sm text-stone-600">
        Each player brings one gift. Its name stays hidden until it is unwrapped.
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
          <Field label="Gift you're bringing">
            <input
              value={gift}
              onChange={(e) => setGift(e.target.value)}
              placeholder="Candle set"
              maxLength={120}
              className={inputClass}
            />
          </Field>
        </div>
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
  players,
  onMove,
  onBackToLobby,
}: {
  game: GameState;
  players: LobbyPlayer[];
  onMove: (move: GameMove) => void;
  onBackToLobby: () => void;
}) {
  // Gift names come from the player view, so wrapped gifts stay hidden.
  const view = toPlayerView(game);
  const moves = getAvailableMoves(game);
  const actor = moves.playerId;
  const nameOf = (id: string | null) =>
    players.find((p) => p.id === id)?.name ?? "Someone";
  const finished = game.phase === "finished";

  return (
    <div className="space-y-6">
      {finished ? (
        <Alert tone="success">
          <p className="font-semibold">Everyone has a gift.</p>
        </Alert>
      ) : (
        <Alert tone="info">
          <p className="font-semibold">
            {game.phase === "final"
              ? `${nameOf(actor)} can swap their gift for any unfrozen gift, or pass.`
              : `${nameOf(actor)}'s turn`}
          </p>
        </Alert>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {view.gifts.map((gift) => {
          const canOpen = actor !== null && moves.openable.includes(gift.id);
          const canSteal = actor !== null && moves.stealable.includes(gift.id);
          return (
            <li key={gift.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">
                    {gift.opened ? gift.name : "Wrapped gift"}
                  </p>
                  {gift.stealCount >= game.stealLimit ? (
                    <span className="shrink-0 rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                      Frozen
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-stone-500">
                  {gift.holderId
                    ? `Held by ${nameOf(gift.holderId)} · ${gift.stealCount}/${game.stealLimit} steals`
                    : "Not picked up yet"}
                </p>
                {canOpen || canSteal ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canOpen && actor ? (
                      <Button
                        onClick={() =>
                          onMove({ type: "open", playerId: actor, giftId: gift.id })
                        }
                      >
                        Unwrap
                      </Button>
                    ) : null}
                    {canSteal && actor ? (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          onMove({ type: "steal", playerId: actor, giftId: gift.id })
                        }
                      >
                        Steal from {nameOf(gift.holderId)}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap justify-end gap-3">
        {moves.canPass && actor ? (
          <Button onClick={() => onMove({ type: "pass", playerId: actor })}>
            Keep my gift
          </Button>
        ) : null}
        <Button variant="secondary" onClick={onBackToLobby}>
          Back to the lobby
        </Button>
      </div>
    </div>
  );
}
