import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_IMAGE_BYTES,
  detectImageType,
  imageTypeForExt,
  isImageId,
} from "./chat-image";
import { MAX_CHAT_TEXT, chatImageUrl, toPublicMessage } from "./public-chat";
import type { ChatMessage } from "./types";
import { sendMessageSchema } from "./validation";

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

describe("detectImageType", () => {
  it("recognizes JPEG, PNG, GIF and WebP by their first bytes", () => {
    assert.equal(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext, "jpg");
    assert.equal(
      detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))?.mime,
      "image/png",
    );
    assert.equal(detectImageType(bytes(...ascii("GIF89a"), 1, 0))?.ext, "gif");
    assert.equal(detectImageType(bytes(...ascii("GIF87a"), 1, 0))?.ext, "gif");
    assert.equal(
      detectImageType(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP")))?.ext,
      "webp",
    );
  });

  it("rejects text, SVG, other RIFF files, and empty or tiny input", () => {
    assert.equal(detectImageType(bytes(...ascii("hello world"))), null);
    assert.equal(detectImageType(bytes(...ascii("<svg xmlns='x'></svg>"))), null);
    assert.equal(
      detectImageType(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE"))),
      null,
    );
    assert.equal(detectImageType(bytes()), null);
    assert.equal(detectImageType(bytes(0xff, 0xd8)), null);
  });
});

describe("image ids and extensions", () => {
  it("accepts only 21-character nanoid-style ids", () => {
    assert.equal(isImageId("V1StGXR8_Z5jdHi6B-myT"), true);
    assert.equal(isImageId("../../etc/passwd"), false);
    assert.equal(isImageId("short"), false);
    assert.equal(isImageId("V1StGXR8_Z5jdHi6B-my/"), false);
    assert.equal(isImageId(""), false);
  });

  it("only maps allowed extensions", () => {
    assert.equal(imageTypeForExt("png")?.mime, "image/png");
    assert.equal(imageTypeForExt("svg"), null);
    assert.equal(imageTypeForExt("toString"), null);
  });

  it("limits images to 5 MB", () => {
    assert.equal(MAX_IMAGE_BYTES, 5 * 1024 * 1024);
  });
});

describe("toPublicMessage", () => {
  const stored: ChatMessage = {
    id: "m1",
    eventId: "evt1",
    authorName: "Ann Lee",
    authorEmail: "ann@example.com",
    text: "hi all",
    image: { id: "V1StGXR8_Z5jdHi6B-myT", ext: "png" },
    createdAt: "2026-11-20T23:00:00.000Z",
  };

  it("never includes the author's email", () => {
    const view = toPublicMessage(stored);
    assert.equal(JSON.stringify(view).includes("ann@example.com"), false);
    assert.equal("authorEmail" in view, false);
    assert.deepEqual(Object.keys(view).sort(), [
      "authorName",
      "createdAt",
      "id",
      "imageUrl",
      "text",
    ]);
  });

  it("builds the image URL, and omits it for text-only messages", () => {
    assert.equal(
      toPublicMessage(stored).imageUrl,
      chatImageUrl("evt1", "V1StGXR8_Z5jdHi6B-myT"),
    );
    assert.equal(toPublicMessage({ ...stored, image: undefined }).imageUrl, undefined);
  });
});

describe("sendMessageSchema", () => {
  const identity = { name: "Ann  Lee", email: " Ann@Example.com " };

  it("normalizes identity and trims text", () => {
    const parsed = sendMessageSchema.parse({ identity, text: "  hello  " });
    assert.equal(parsed.identity.name, "Ann Lee");
    assert.equal(parsed.identity.email, "ann@example.com");
    assert.equal(parsed.text, "hello");
  });

  it("treats blank text as no text", () => {
    assert.equal(sendMessageSchema.parse({ identity, text: "   " }).text, undefined);
    assert.equal(sendMessageSchema.parse({ identity }).text, undefined);
  });

  it("rejects text over the limit", () => {
    assert.equal(
      sendMessageSchema.safeParse({ identity, text: "x".repeat(MAX_CHAT_TEXT + 1) }).success,
      false,
    );
    assert.equal(
      sendMessageSchema.safeParse({ identity, text: "x".repeat(MAX_CHAT_TEXT) }).success,
      true,
    );
  });

  it("rejects a bad email", () => {
    assert.equal(
      sendMessageSchema.safeParse({ identity: { name: "A", email: "nope" } }).success,
      false,
    );
  });
});
