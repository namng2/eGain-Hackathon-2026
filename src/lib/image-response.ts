/** Serves stored image bytes with safe headers. The type must come from our own allowlist. */
export function imageResponse(bytes: Uint8Array, mime: string): Response {
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(bytes.byteLength),
      // The type is ours; stop browsers from guessing a different one.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=300",
    },
  });
}
