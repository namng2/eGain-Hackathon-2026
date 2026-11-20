"use client";

import { useState } from "react";
import { Button } from "./ui";

export function CopyLinkButton({ value }: { value: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      // Clipboard can be blocked on plain http. The field is selectable, so fall back to that.
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <Button onClick={copy} className="shrink-0">
      {state === "copied"
        ? "Copied!"
        : state === "failed"
          ? "Select and copy"
          : "Copy link"}
    </Button>
  );
}
