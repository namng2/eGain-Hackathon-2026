"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { errorText } from "@/lib/errors";
import { resizeToAvatar } from "@/lib/resize-image";
import { Avatar } from "./avatar";
import { Button } from "./ui";

/**
 * Choose, change, or remove a profile picture. The photo is cropped to a small
 * square in the browser first. `onPick` gets the ready-to-upload file; if it
 * throws or rejects, the preview is undone and the message is shown.
 */
export function AvatarPicker({
  name,
  currentUrl,
  onPick,
  onClear,
  disabled = false,
}: {
  name: string;
  /** The picture already saved, if any */
  currentUrl?: string;
  onPick: (file: File) => void | Promise<void>;
  onClear: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function showPreview(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setPreview(previewRef.current);
  }

  async function handlePick(e: ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    e.target.value = ""; // so choosing the same file again still fires
    if (!chosen) return;
    if (!chosen.type.startsWith("image/")) {
      setError("Choose a picture file (JPEG, PNG, GIF, or WebP).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const small = await resizeToAvatar(chosen);
      showPreview(small);
      setCleared(false);
      await onPick(small);
    } catch (err) {
      showPreview(null);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    setBusy(true);
    setError(null);
    try {
      await onClear();
      showPreview(null);
      setCleared(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const shownUrl = preview ?? (cleared ? undefined : currentUrl);

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name || "?"} url={shownUrl} size="lg" />
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handlePick}
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose a profile picture"
          />
          <Button
            variant="secondary"
            disabled={disabled || busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "Working…" : shownUrl ? "Change photo" : "Add photo"}
          </Button>
          {shownUrl ? (
            <Button
              variant="secondary"
              disabled={disabled || busy}
              onClick={() => void handleClear()}
            >
              Remove
            </Button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
