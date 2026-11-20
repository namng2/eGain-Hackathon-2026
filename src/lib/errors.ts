/** Turns anything thrown by a fetch or a helper into a sentence we can show. */
export function errorText(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}
