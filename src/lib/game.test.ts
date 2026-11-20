import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GameRuleError,
  applyMove,
  getAvailableMoves,
  giftHeldBy,
  isGameOver,
  startGame,
  toPlayerView,
} from "./game";
import type { GameState } from "./types";

/** Small seeded random number generator so test games are repeatable. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setup(playerCount: number, stealLimit = 3, seed = 1): GameState {
  const playerIds = Array.from({ length: playerCount }, (_, i) => `p${i}`);
  return startGame({
    eventId: "evt",
    playerIds,
    gifts: playerIds.map((id) => ({ id: `gift-${id}`, contributorId: id })),
    stealLimit,
    random: seeded(seed),
  });
}

function rule(message: RegExp) {
  return (err: unknown) => err instanceof GameRuleError && message.test(err.message);
}

describe("startGame", () => {
  it("shuffles every player into the turn order exactly once", () => {
    const state = setup(8);
    assert.deepEqual([...state.turnOrder].sort(), ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
    assert.equal(state.currentPlayerId, state.turnOrder[0]);
    assert.ok(state.turnOrder.includes(state.finalPlayerId));
    assert.equal(state.phase, "playing");
  });

  it("rejects bad input", () => {
    const base = {
      eventId: "evt",
      playerIds: ["a", "b"],
      gifts: [
        { id: "ga", contributorId: "a" },
        { id: "gb", contributorId: "b" },
      ],
      stealLimit: 3,
    };
    assert.throws(
      () => startGame({ ...base, playerIds: ["a"], gifts: [base.gifts[0]] }),
      rule(/at least two/),
    );
    assert.throws(() => startGame({ ...base, playerIds: ["a", "a"] }), rule(/only be in the game once/));
    assert.throws(() => startGame({ ...base, stealLimit: 0 }), rule(/steal limit/));
    assert.throws(() => startGame({ ...base, gifts: [base.gifts[0]] }), rule(/exactly one gift/));
    assert.throws(
      () => startGame({ ...base, gifts: [...base.gifts, { id: "gc", contributorId: "a" }] }),
      rule(/exactly one gift/),
    );
    assert.throws(
      () => startGame({ ...base, gifts: [base.gifts[0], { id: "gx", contributorId: "stranger" }] }),
      rule(/from a player/),
    );
    assert.throws(
      () => startGame({ ...base, gifts: [base.gifts[0], { id: "ga", contributorId: "b" }] }),
      rule(/its own ID/),
    );
  });
});

describe("regular turns", () => {
  it("opening a gift moves to the next player in order", () => {
    let state = setup(3);
    const [first, second] = state.turnOrder;
    state = applyMove(state, { type: "open", playerId: first, giftId: "gift-p0" });
    assert.equal(giftHeldBy(state, first)?.id, "gift-p0");
    assert.equal(state.turnIndex, 1);
    assert.equal(state.currentPlayerId, second);
  });

  it("a steal gives the next action to the person stolen from", () => {
    let state = setup(3);
    const [first, second, third] = state.turnOrder;
    state = applyMove(state, { type: "open", playerId: first, giftId: "gift-p0" });
    state = applyMove(state, { type: "steal", playerId: second, giftId: "gift-p0" });

    assert.equal(giftHeldBy(state, second)?.id, "gift-p0");
    assert.equal(giftHeldBy(state, first), undefined);
    assert.equal(state.gifts.find((g) => g.id === "gift-p0")?.stealCount, 1);
    assert.equal(state.currentPlayerId, first);
    assert.equal(state.turnIndex, 1);

    state = applyMove(state, { type: "open", playerId: first, giftId: "gift-p1" });
    assert.equal(state.currentPlayerId, third);
  });

  it("a gift can't be stolen once it reaches the steal limit", () => {
    let state = setup(3, 1);
    const [first, second, third] = state.turnOrder;
    state = applyMove(state, { type: "open", playerId: first, giftId: "gift-p0" });
    state = applyMove(state, { type: "open", playerId: second, giftId: "gift-p1" });
    state = applyMove(state, { type: "steal", playerId: third, giftId: "gift-p0" });

    assert.equal(state.currentPlayerId, first);
    assert.deepEqual(getAvailableMoves(state).stealable, ["gift-p1"]);
    assert.throws(
      () => applyMove(state, { type: "steal", playerId: first, giftId: "gift-p0" }),
      rule(/frozen/),
    );
  });

  it("the person stolen from can't steal that gift straight back", () => {
    let state = setup(3);
    const [first, second, third] = state.turnOrder;
    state = applyMove(state, { type: "open", playerId: first, giftId: "gift-p0" });
    state = applyMove(state, { type: "open", playerId: second, giftId: "gift-p1" });
    state = applyMove(state, { type: "steal", playerId: third, giftId: "gift-p0" });

    assert.deepEqual(state.blocked, { playerId: first, giftId: "gift-p0" });
    assert.deepEqual(getAvailableMoves(state).stealable, ["gift-p1"]);
    assert.throws(
      () => applyMove(state, { type: "steal", playerId: first, giftId: "gift-p0" }),
      rule(/steal back/),
    );

    // Stealing a different gift is fine, and the block moves to the new victim.
    state = applyMove(state, { type: "steal", playerId: first, giftId: "gift-p1" });
    assert.deepEqual(state.blocked, { playerId: second, giftId: "gift-p1" });
    assert.ok(getAvailableMoves(state).stealable.includes("gift-p0"));
  });

  it("opening a gift clears the steal-back block", () => {
    let state = setup(3);
    const [first, second] = state.turnOrder;
    state = applyMove(state, { type: "open", playerId: first, giftId: "gift-p0" });
    state = applyMove(state, { type: "steal", playerId: second, giftId: "gift-p0" });
    state = applyMove(state, { type: "open", playerId: first, giftId: "gift-p1" });
    assert.equal(state.blocked, null);
  });

  it("rejects moves out of turn, passing, and reopening a gift", () => {
    let state = setup(3);
    const [first, second] = state.turnOrder;
    assert.throws(
      () => applyMove(state, { type: "open", playerId: second, giftId: "gift-p0" }),
      rule(/isn't your turn/),
    );
    assert.throws(() => applyMove(state, { type: "pass", playerId: first }), rule(/open or steal/));
    assert.throws(
      () => applyMove(state, { type: "steal", playerId: first, giftId: "gift-p0" }),
      rule(/hasn't been opened/),
    );
    assert.throws(
      () => applyMove(state, { type: "open", playerId: first, giftId: "nope" }),
      rule(/isn't in this game/),
    );
    state = applyMove(state, { type: "open", playerId: first, giftId: "gift-p0" });
    assert.throws(
      () => applyMove(state, { type: "open", playerId: second, giftId: "gift-p0" }),
      rule(/already open/),
    );
  });

  it("doesn't change the state it was given", () => {
    const state = setup(3);
    const before = structuredClone(state);
    applyMove(state, { type: "open", playerId: state.turnOrder[0], giftId: "gift-p0" });
    assert.deepEqual(state, before);
  });
});

describe("final round", () => {
  function allOpened(): GameState {
    let state = setup(3);
    state.turnOrder.forEach((playerId, i) => {
      state = applyMove(state, { type: "open", playerId, giftId: `gift-p${i}` });
    });
    return state;
  }

  it("starts once every gift is open, with the chosen final player", () => {
    const state = allOpened();
    assert.equal(state.phase, "final");
    assert.equal(state.currentPlayerId, state.finalPlayerId);
    const moves = getAvailableMoves(state);
    assert.deepEqual(moves.openable, []);
    assert.equal(moves.canPass, true);
    assert.equal(moves.stealable.length, 2);
  });

  it("a final steal swaps gifts and ends the game", () => {
    let state = allOpened();
    const finalPlayer = state.finalPlayerId;
    const ownGift = giftHeldBy(state, finalPlayer)!.id;
    const target = state.gifts.find((g) => g.holderId !== finalPlayer)!;
    const victim = target.holderId!;

    state = applyMove(state, { type: "steal", playerId: finalPlayer, giftId: target.id });
    assert.equal(giftHeldBy(state, finalPlayer)?.id, target.id);
    assert.equal(giftHeldBy(state, victim)?.id, ownGift);
    assert.equal(state.gifts.find((g) => g.id === target.id)?.stealCount, 1);
    assert.ok(isGameOver(state));
    assert.equal(state.currentPlayerId, null);
  });

  it("passing in the final round ends the game with gifts unchanged", () => {
    const before = allOpened();
    const after = applyMove(before, { type: "pass", playerId: before.finalPlayerId });
    assert.ok(isGameOver(after));
    assert.deepEqual(after.gifts, before.gifts);
  });

  it("rejects any move after the game is over", () => {
    let state = allOpened();
    state = applyMove(state, { type: "pass", playerId: state.finalPlayerId });
    assert.throws(
      () => applyMove(state, { type: "pass", playerId: state.finalPlayerId }),
      rule(/already over/),
    );
    assert.deepEqual(getAvailableMoves(state), {
      playerId: null,
      openable: [],
      stealable: [],
      canPass: false,
    });
  });
});

describe("gift names", () => {
  function namedGame(): GameState {
    return startGame({
      eventId: "evt",
      playerIds: ["a", "b"],
      gifts: [
        { id: "ga", contributorId: "a", name: "Coffee mug" },
        { id: "gb", contributorId: "b", name: "Board game" },
      ],
      stealLimit: 3,
      random: seeded(1),
    });
  }

  it("keeps each gift's name in the game", () => {
    const state = namedGame();
    assert.deepEqual(
      state.gifts.map((g) => g.name),
      ["Coffee mug", "Board game"],
    );
  });

  it("the player view hides names until a gift is opened", () => {
    let state = namedGame();
    assert.ok(toPlayerView(state).gifts.every((g) => g.name === undefined));

    state = applyMove(state, { type: "open", playerId: state.turnOrder[0], giftId: "ga" });
    const view = toPlayerView(state);
    assert.equal(view.gifts.find((g) => g.id === "ga")?.name, "Coffee mug");
    assert.equal(view.gifts.find((g) => g.id === "gb")?.name, undefined);
    // The real state still knows every name.
    assert.equal(state.gifts.find((g) => g.id === "gb")?.name, "Board game");
  });
});

describe("full games", () => {
  it("random games always finish with one gift per player and no gift over the limit", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const playerCount = 2 + (seed % 9);
      const stealLimit = 1 + (seed % 3);
      const pick = seeded(seed * 7919);
      let state = setup(playerCount, stealLimit, seed);

      let moves = 0;
      while (!isGameOver(state)) {
        const available = getAvailableMoves(state);
        const options = [
          ...available.openable.map((giftId) => ({ type: "open" as const, giftId })),
          ...available.stealable.map((giftId) => ({ type: "steal" as const, giftId })),
        ];
        const playerId = available.playerId!;
        if (available.canPass && pick() < 0.3) {
          state = applyMove(state, { type: "pass", playerId });
        } else if (options.length === 0) {
          state = applyMove(state, { type: "pass", playerId });
        } else {
          const choice = options[Math.floor(pick() * options.length)];
          state = applyMove(state, { ...choice, playerId });
        }
        moves++;
        assert.ok(moves <= playerCount * (stealLimit + 2), `seed ${seed} ran too long`);
      }

      const holders = state.gifts.map((g) => g.holderId).sort();
      assert.deepEqual(holders, [...state.turnOrder].sort(), `seed ${seed}`);
      assert.ok(state.gifts.every((g) => g.stealCount <= stealLimit), `seed ${seed}`);
    }
  });
});
