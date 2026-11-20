/**
 * White elephant rules. Pure functions only: no storage, no network, no UI.
 *
 * Callers keep a GameState, ask getAvailableMoves() what the current player
 * may do, and pass a move to applyMove() to get the next state. Invalid moves
 * throw a GameRuleError whose message can be shown to players as-is.
 */
import type {
  AvailableMoves,
  GameGift,
  GameMove,
  GameState,
} from "./types";

export class GameRuleError extends Error {}

export type StartGameInput = {
  eventId: string;
  playerIds: string[];
  gifts: { id: string; contributorId: string; name?: string }[];
  stealLimit: number;
  /** Returns a number in [0, 1). Defaults to Math.random. */
  random?: () => number;
};

export function startGame(input: StartGameInput): GameState {
  const { eventId, playerIds, gifts, stealLimit } = input;
  const random = input.random ?? Math.random;

  if (playerIds.length < 2) {
    throw new GameRuleError("A game needs at least two players.");
  }
  if (new Set(playerIds).size !== playerIds.length) {
    throw new GameRuleError("Each player can only be in the game once.");
  }
  if (new Set(gifts.map((g) => g.id)).size !== gifts.length) {
    throw new GameRuleError("Each gift needs its own ID.");
  }
  if (!Number.isInteger(stealLimit) || stealLimit < 1) {
    throw new GameRuleError("The steal limit must be a whole number of at least 1.");
  }
  const players = new Set(playerIds);
  for (const gift of gifts) {
    if (!players.has(gift.contributorId)) {
      throw new GameRuleError("Every gift must come from a player in the game.");
    }
  }
  for (const playerId of playerIds) {
    const count = gifts.filter((g) => g.contributorId === playerId).length;
    if (count !== 1) {
      throw new GameRuleError("Every player must bring exactly one gift.");
    }
  }

  const turnOrder = shuffle(playerIds, random);
  return {
    eventId,
    stealLimit,
    turnOrder,
    turnIndex: 0,
    currentPlayerId: turnOrder[0],
    phase: "playing",
    gifts: gifts.map((g) => ({
      id: g.id,
      contributorId: g.contributorId,
      name: g.name,
      opened: false,
      holderId: null,
      stealCount: 0,
    })),
    blocked: null,
    finalPlayerId: playerIds[Math.floor(random() * playerIds.length)],
    history: [],
  };
}

export function isFrozen(gift: GameGift, stealLimit: number): boolean {
  return gift.stealCount >= stealLimit;
}

export function giftHeldBy(
  state: GameState,
  playerId: string,
): GameGift | undefined {
  return state.gifts.find((g) => g.holderId === playerId);
}

export function isGameOver(state: GameState): boolean {
  return state.phase === "finished";
}

/** The game as players may see it: wrapped gifts don't reveal their names. */
export function toPlayerView(state: GameState): GameState {
  return {
    ...state,
    gifts: state.gifts.map((g) => (g.opened ? { ...g } : { ...g, name: undefined })),
  };
}

export function getAvailableMoves(state: GameState): AvailableMoves {
  const playerId = state.currentPlayerId;
  if (state.phase === "finished" || playerId === null) {
    return { playerId: null, openable: [], stealable: [], canPass: false };
  }
  const stealable = state.gifts
    .filter((g) => stealProblem(state, playerId, g) === null)
    .map((g) => g.id);
  if (state.phase === "final") {
    return { playerId, openable: [], stealable, canPass: true };
  }
  const openable = state.gifts.filter((g) => !g.opened).map((g) => g.id);
  return { playerId, openable, stealable, canPass: false };
}

export function applyMove(state: GameState, move: GameMove): GameState {
  if (state.phase === "finished") {
    throw new GameRuleError("The game is already over.");
  }
  if (move.playerId !== state.currentPlayerId) {
    throw new GameRuleError("It isn't your turn.");
  }

  const next = structuredClone(state);
  next.history.push(move);

  switch (move.type) {
    case "open":
      return openGift(next, move.playerId, move.giftId);
    case "steal":
      return stealGift(next, move.playerId, move.giftId);
    case "pass":
      if (next.phase !== "final") {
        throw new GameRuleError("You have to open or steal a gift on your turn.");
      }
      return finish(next);
  }
}

function openGift(state: GameState, playerId: string, giftId: string): GameState {
  if (state.phase !== "playing") {
    throw new GameRuleError("Every gift is already open.");
  }
  const gift = findGift(state, giftId);
  if (gift.opened) {
    throw new GameRuleError("That gift is already open.");
  }
  gift.opened = true;
  gift.holderId = playerId;
  state.blocked = null;

  if (state.gifts.every((g) => g.opened)) {
    state.phase = "final";
    state.currentPlayerId = state.finalPlayerId;
  } else {
    state.turnIndex += 1;
    state.currentPlayerId = state.turnOrder[state.turnIndex];
  }
  return state;
}

function stealGift(state: GameState, playerId: string, giftId: string): GameState {
  const gift = findGift(state, giftId);
  const problem = stealProblem(state, playerId, gift);
  if (problem) throw new GameRuleError(problem);

  const victimId = gift.holderId as string;
  gift.holderId = playerId;
  gift.stealCount += 1;

  if (state.phase === "final") {
    const own = state.gifts.find((g) => g.id !== gift.id && g.holderId === playerId);
    if (own) own.holderId = victimId;
    return finish(state);
  }

  state.blocked = { playerId: victimId, giftId };
  state.currentPlayerId = victimId;
  return state;
}

/** Why this player can't steal this gift right now, or null if they can. */
function stealProblem(
  state: GameState,
  playerId: string,
  gift: GameGift,
): string | null {
  if (!gift.opened) return "That gift hasn't been opened yet.";
  if (gift.holderId === playerId) return "You already have that gift.";
  if (isFrozen(gift, state.stealLimit)) return "That gift is frozen.";
  if (state.blocked?.playerId === playerId && state.blocked.giftId === gift.id) {
    return "You can't steal back the gift that was just taken from you.";
  }
  return null;
}

function finish(state: GameState): GameState {
  state.phase = "finished";
  state.currentPlayerId = null;
  state.blocked = null;
  return state;
}

function findGift(state: GameState, giftId: string): GameGift {
  const gift = state.gifts.find((g) => g.id === giftId);
  if (!gift) throw new GameRuleError("That gift isn't in this game.");
  return gift;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
