/**
 * Plays one random white elephant game in the terminal so you can watch the
 * rules work. Run with: npx tsx scripts/try-game.ts
 */
import { applyMove, getAvailableMoves, startGame } from "../src/lib/game";
import type { GameState } from "../src/lib/types";

let game = startGame({
  eventId: "demo",
  playerIds: ["Alice", "Bob", "Carol", "Dave"],
  gifts: [
    { id: "g1", contributorId: "Alice", name: "Coffee mug" },
    { id: "g2", contributorId: "Bob", name: "Scented candle" },
    { id: "g3", contributorId: "Carol", name: "Fuzzy socks" },
    { id: "g4", contributorId: "Dave", name: "Board game" },
  ],
  stealLimit: 3,
});

function giftName(state: GameState, giftId: string): string {
  const gift = state.gifts.find((g) => g.id === giftId);
  return gift?.name ?? giftId;
}

console.log("Turn order:", game.turnOrder.join(", "));
console.log("Final stealer:", game.finalPlayerId);

while (game.phase !== "finished") {
  const moves = getAvailableMoves(game);
  const player = moves.playerId as string;
  const label = game.phase === "final" ? "final steal" : "turn";
  const canSteal = moves.stealable.map((id) => giftName(game, id)).join(", ") || "nothing";
  console.log(`\n${player}'s ${label}. Can steal: ${canSteal}`);

  if (moves.stealable.length > 0 && Math.random() < 0.5) {
    const giftId = moves.stealable[Math.floor(Math.random() * moves.stealable.length)];
    const from = game.gifts.find((g) => g.id === giftId)?.holderId;
    game = applyMove(game, { type: "steal", playerId: player, giftId });
    console.log(`  ${player} steals the ${giftName(game, giftId)} from ${from}`);
  } else if (moves.openable.length > 0) {
    const giftId = moves.openable[0];
    game = applyMove(game, { type: "open", playerId: player, giftId });
    console.log(`  ${player} opens a gift: ${giftName(game, giftId)}`);
  } else {
    game = applyMove(game, { type: "pass", playerId: player });
    console.log(`  ${player} keeps their gift`);
  }
}

console.log("\nFinal gifts:");
for (const g of game.gifts) {
  const times = g.stealCount === 1 ? "time" : "times";
  console.log(`  ${g.holderId} has the ${g.name} (stolen ${g.stealCount} ${times})`);
}
