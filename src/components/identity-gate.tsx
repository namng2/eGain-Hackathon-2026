"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useIdentity } from "@/lib/use-identity";
import type { Identity } from "@/lib/types";
import { Alert, Button, Card, Field, inputClass } from "./ui";

type GateProps = {
  title: string;
  description: string;
  children: (identity: Identity, forget: () => void) => ReactNode;
};

/**
 * Shows the children once the visitor has entered a name and email.
 * This is not a login. The details are only remembered in this browser.
 */
export function IdentityGate({ title, description, children }: GateProps) {
  const { identity, ready, setIdentity, forget } = useIdentity();

  if (!ready) return <p className="text-sm text-stone-500">Loading…</p>;
  if (!identity) {
    return (
      <IdentityForm
        title={title}
        description={description}
        onSubmit={setIdentity}
      />
    );
  }
  return <>{children(identity, forget)}</>;
}

function IdentityForm({
  title,
  description,
  onSubmit,
}: {
  title: string;
  description: string;
  onSubmit: (identity: Identity) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName) {
      setError("Enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    onSubmit({ name: cleanName, email: cleanEmail });
  }

  return (
    <Card>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field label="Your name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={80}
            className={inputClass}
          />
        </Field>
        <Field label="Your email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={200}
            className={inputClass}
          />
        </Field>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="flex justify-end">
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Card>
  );
}
