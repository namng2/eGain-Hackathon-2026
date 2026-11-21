import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MYSTERY_GIFT, gameFromRoster } from "./event-game";
import { applyMove, toPlayerView } from "./game";

const event = { id: "evt1", stealLimit: 2 };
const participants = [
  { id: "alex", gift: "Mini succulent set" },
  { id: "priya", gift: "Board game" },
  { id: "sam", gift: undefined },
];

describe("gameFromRoster", () => {
  it("makes one player and one gift per sign-up", () => {
    const game = gameFromRoster(event, participants);
    assert.equal(game.eventId, "evt1");
    assert.deepEqual([...game.turnOrder].sort(), ["alex", "priya", "sam"]);
    assert.deepEqual(
      game.gifts.map((g) => g.contributorId).sort(),
      ["alex", "priya", "sam"],
    );
  });

  it("uses the event's steal limit", () => {
    assert.equal(gameFromRoster(event, participants).stealLimit, 2);
    assert.equal(gameFromRoster({ ...event, stealLimit: 5 }, participants).stealLimit, 5);
  });

  it("uses each person's gift, and a mystery gift when they didn't add one", () => {
    const game = gameFromRoster(event, [...participants, { id: "kim", gift: "   " }]);
    const nameFor = (id: string) => game.gifts.find((g) => g.contributorId === id)?.name;
    assert.equal(nameFor("alex"), "Mini succulent set");
    assert.equal(nameFor("sam"), MYSTERY_GIFT);
    assert.equal(nameFor("kim"), MYSTERY_GIFT);
  });

  it("keeps gifts hidden until they're unwrapped", () => {
    let game = gameFromRoster(event, participants);
    assert.ok(toPlayerView(game).gifts.every((g) => g.name === undefined));

    const first = game.turnOrder[0];
    const giftId = game.gifts[0].id;
    game = applyMove(game, { type: "open", playerId: first, giftId });
    const view = toPlayerView(game);
    assert.equal(view.gifts.filter((g) => g.name !== undefined).length, 1);
    assert.ok(view.gifts.find((g) => g.id === giftId)?.name);
  });
});
