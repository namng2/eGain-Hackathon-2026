import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_AVATAR_BYTES, avatarColor, avatarUrl, initials } from "./avatar";
import {
  REACTION_EMOJIS,
  isReactionEmoji,
  summarizeReactions,
  toggleReactionIn,
} from "./reactions";

describe("toggleReactionIn", () => {
  it("adds a reaction, then removes it when toggled again", () => {
    const added = toggleReactionIn(undefined, "🔥", " Ann@Example.com ");
    assert.deepEqual(added, { "🔥": ["ann@example.com"] });
    const removed = toggleReactionIn(added, "🔥", "ann@example.com");
    assert.deepEqual(removed, {});
  });

  it("keeps other people's and other emojis' reactions, and does not change the input", () => {
    const start = { "🔥": ["bob@example.com"], "🎁": ["bob@example.com"] };
    const next = toggleReactionIn(start, "🔥", "ann@example.com");
    assert.deepEqual(next["🔥"], ["bob@example.com", "ann@example.com"]);
    assert.deepEqual(next["🎁"], ["bob@example.com"]);
    assert.deepEqual(start["🔥"], ["bob@example.com"]);
  });
});

describe("summarizeReactions", () => {
  it("counts per emoji in a fixed order and marks the viewer's own", () => {
    const summary = summarizeReactions(
      {
        "❤️": ["a@x.co"],
        "👍": ["a@x.co", "b@x.co"],
        "🔥": [],
      },
      "B@x.co",
    );
    assert.deepEqual(summary, [
      { emoji: "👍", count: 2, mine: true },
      { emoji: "❤️", count: 1, mine: false },
    ]);
  });

  it("returns nothing when there are no reactions", () => {
    assert.deepEqual(summarizeReactions(undefined, "a@x.co"), []);
  });
});

describe("reaction emojis", () => {
  it("accepts only the five allowed emojis", () => {
    for (const emoji of REACTION_EMOJIS) assert.equal(isReactionEmoji(emoji), true);
    assert.equal(isReactionEmoji("💩"), false);
    assert.equal(isReactionEmoji(""), false);
  });
});

describe("avatar helpers", () => {
  it("makes initials from first and last word", () => {
    assert.equal(initials("Ann Lee"), "AL");
    assert.equal(initials("  bob  "), "B");
    assert.equal(initials("Mary Jane Watson"), "MW");
    assert.equal(initials(""), "?");
  });

  it("gives the same name the same color, ignoring case and spaces at the ends", () => {
    assert.equal(avatarColor("Ann Lee"), avatarColor(" ann lee "));
    assert.match(avatarColor("Ann Lee"), /^hsl\(\d+ 45% 38%\)$/);
  });

  it("builds the avatar URL and limits size to 1 MB", () => {
    assert.equal(avatarUrl("evt1", "abc"), "/api/events/evt1/avatars/abc");
    assert.equal(MAX_AVATAR_BYTES, 1024 * 1024);
  });
});
