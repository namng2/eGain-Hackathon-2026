/**
 * Rules for images attached to chat messages. Pure functions, no I/O.
 *
 * The file type comes from the file's own first bytes, never from the file
 * name or the type the browser reports, which anyone can fake. SVG is not
 * allowed because it can carry scripts.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageType = {
  ext: "jpg" | "png" | "gif" | "webp";
  mime: string;
};

const TYPES: Record<ImageType["ext"], ImageType> = {
  jpg: { ext: "jpg", mime: "image/jpeg" },
  png: { ext: "png", mime: "image/png" },
  gif: { ext: "gif", mime: "image/gif" },
  webp: { ext: "webp", mime: "image/webp" },
};

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, i) => bytes[offset + i] === value);
}

/** Returns the image type if the bytes really are a JPEG, PNG, GIF, or WebP. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return TYPES.jpg;
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return TYPES.png;
  }
  // "GIF87a" or "GIF89a"
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
    return TYPES.gif;
  }
  // "RIFF" ???? "WEBP"
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return TYPES.webp;
  }
  return null;
}

/** Looks up the type for a stored extension, or null if it isn't one we allow. */
export function imageTypeForExt(ext: string): ImageType | null {
  return Object.hasOwn(TYPES, ext) ? TYPES[ext as ImageType["ext"]] : null;
}

/** Image ids are nanoid(21) strings. Anything else is refused, which blocks path tricks like "../". */
export function isImageId(id: string): boolean {
  return /^[A-Za-z0-9_-]{21}$/.test(id);
}
