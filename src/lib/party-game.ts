// Pure game rules for the white elephant "unwrap and steal" round.
// No storage, no network. The party UI calls these and saves the result.

export const BUDGETS = [15, 25, 50] as const;
export type Budget = (typeof BUDGETS)[number];

/** A gift can be stolen this many times, then it locks to its holder. */
export const STEAL_LIMIT = 3;

export type PartyPlayer = {
  id: string;
  name: string;
  interests: string;
  budget: Budget;
  confirmed: boolean;
};

export type PartyGift = {
  id: string;
  title: string;
  description: string;
  price: number;
  /** The player whose interests inspired this gift. Revealed at the end. */
  originId: string;
  holderId: string | null;
  opened: boolean;
  steals: number;
  locked: boolean;
  /** The player who lost this gift most recently. They cannot steal it straight back. */
  lastHolderId: string | null;
};

export type PartyGame = {
  phase: "lobby" | "playing" | "done";
  players: PartyPlayer[];
  gifts: PartyGift[];
  /** Player ids in turn order. */
  order: string[];
  /** Index into `order` for whose turn it is. */
  turn: number;
  message: string;
};

export type Move = { type: "unwrap" | "steal"; giftId: string };

export function newLobby(players: PartyPlayer[] = []): PartyGame {
  return {
    phase: "lobby",
    players,
    gifts: [],
    order: [],
    turn: 0,
    message: "",
  };
}

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Placeholder gift copy until the AI writer is connected. */
function demoGift(player: PartyPlayer): PartyGift {
  const topic = player.interests.split(",")[0]?.trim() || "surprise";
  return {
    id: `gift-${player.id}`,
    title: `${topic.charAt(0).toUpperCase()}${topic.slice(1)} gift set`,
    description: `A $${player.budget} pick inspired by ${topic}. Demo text until the AI writer is connected.`,
    price: player.budget,
    originId: player.id,
    holderId: null,
    opened: false,
    steals: 0,
    locked: false,
    lastHolderId: null,
  };
}

/** Starts the round: one gift per player, random gift order, random turn order. */
export function startGame(players: PartyPlayer[]): PartyGame {
  return {
    phase: "playing",
    players,
    gifts: shuffle(players.map(demoGift)),
    order: shuffle(players.map((p) => p.id)),
    turn: 0,
    message: "The round has started.",
  };
}

/** Legal moves for a player. With relaxBan, the "no immediate steal-back" rule is lifted. */
export function legalMoves(
  game: PartyGame,
  playerId: string,
  relaxBan = false,
): Move[] {
  const holdsOne = game.gifts.some((g) => g.holderId === playerId);
  const moves: Move[] = [];
  for (const gift of game.gifts) {
    if (gift.locked) continue;
    if (!gift.opened) {
      if (!holdsOne) moves.push({ type: "unwrap", giftId: gift.id });
      continue;
    }
    if (gift.holderId === null || gift.holderId === playerId) continue;
    if (!relaxBan && gift.lastHolderId === playerId) continue;
    moves.push({ type: "steal", giftId: gift.id });
  }
  return moves;
}

/** The moves the current turn can take. Falls back to lifting the steal-back ban so the round never stalls. */
export function movesFor(game: PartyGame, playerId: string): Move[] {
  const strict = legalMoves(game, playerId);
  return strict.length > 0 ? strict : legalMoves(game, playerId, true);
}

function nameOf(game: PartyGame, id: string | null): string {
  return game.players.find((p) => p.id === id)?.name ?? "Someone";
}

/** Applies a move for whoever's turn it is. Invalid moves return the game unchanged. */
export function applyMove(game: PartyGame, move: Move): PartyGame {
  if (game.phase !== "playing") return game;
  const current = game.order[game.turn];
  const allowed = movesFor(game, current).some(
    (m) => m.type === move.type && m.giftId === move.giftId,
  );
  if (!allowed) return game;

  const gifts = game.gifts.map((g) => ({ ...g }));
  const gift = gifts.find((g) => g.id === move.giftId);
  if (!gift) return game;

  let nextTurn: number;
  let message: string;
  if (move.type === "unwrap") {
    gift.opened = true;
    gift.holderId = current;
    nextTurn = (game.turn + 1) % game.order.length;
    message = `${nameOf(game, current)} unwrapped a gift.`;
  } else {
    const victim = gift.holderId;
    gift.holderId = current;
    gift.lastHolderId = victim;
    gift.steals += 1;
    if (gift.steals >= STEAL_LIMIT) gift.locked = true;
    // The player who lost the gift goes next.
    nextTurn = victim ? game.order.indexOf(victim) : game.turn;
    message = `${nameOf(game, current)} stole a gift from ${nameOf(game, victim)}${
      gift.locked ? ". That gift is now locked." : "."
    }`;
  }

  const next: PartyGame = { ...game, gifts, turn: nextTurn, message };
  const nextPlayer = next.order[nextTurn];
  const roundOver =
    gifts.every((g) => g.locked) || movesFor(next, nextPlayer).length === 0;
  return roundOver
    ? { ...next, phase: "done", message: "The round is over. Everyone has a gift." }
    : next;
}
