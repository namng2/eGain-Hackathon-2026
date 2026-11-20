import type { Identity } from "./types";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Without a login, "who you are" is just your name + email. Two identities
 * match when both are equal, ignoring case and extra whitespace.
 */
export function identitiesMatch(a: Identity, b: Identity): boolean {
  return (
    normalizeEmail(a.email) === normalizeEmail(b.email) &&
    normalizeName(a.name).toLowerCase() === normalizeName(b.name).toLowerCase()
  );
}
