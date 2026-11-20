"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Identity } from "./types";

/**
 * Remembers the name + email the visitor last used, so forms can be pre-filled.
 * This is NOT a login: it lives only in this browser and is sent as-is with
 * each request. Storage can be blocked (private mode, settings), so we fall
 * back to an in-memory copy for the rest of the tab's life.
 */

const KEY = "white-elephant:identity";
const listeners = new Set<() => void>();
let memoryRaw: string | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

// `undefined` means "not known yet" (during server render and hydration),
// so components can wait instead of flashing an empty form.
function getServerSnapshot(): string | null | undefined {
  return undefined;
}

function parseIdentity(raw: string | null | undefined): Identity | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Identity>;
    if (typeof value.name === "string" && typeof value.email === "string") {
      return { name: value.name, email: value.email };
    }
    return null;
  } catch {
    return null;
  }
}

export function useIdentity() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const identity = useMemo(() => parseIdentity(raw), [raw]);

  const setIdentity = useCallback((next: Identity) => {
    const json = JSON.stringify({ name: next.name, email: next.email });
    memoryRaw = json;
    try {
      window.localStorage.setItem(KEY, json);
    } catch {
      // Storage unavailable; the in-memory copy still works for this tab.
    }
    emit();
  }, []);

  const forget = useCallback(() => {
    memoryRaw = null;
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // Nothing to clear.
    }
    emit();
  }, []);

  return { identity, ready: raw !== undefined, setIdentity, forget };
}
