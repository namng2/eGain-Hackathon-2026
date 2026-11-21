"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { isValidEmail, isValidPhone, parseContact } from "@/lib/identity-match";
import { useIdentity } from "@/lib/use-identity";
import type { Identity } from "@/lib/types";
import { Alert, Button, Card, Field, inputClass } from "./ui";

type GateProps = {
  title: string;
  description: string;
  /** Drops the bordered box and centers the form instead. */
  bare?: boolean;
  children: (identity: Identity, forget: () => void) => ReactNode;
};

/**
 * Shows the children once the visitor has entered a name and an email or phone.
 * This is not a login. The details are only remembered in this browser.
 */
export function IdentityGate({ title, description, bare, children }: GateProps) {
  const { identity, ready, setIdentity, forget } = useIdentity();

  if (!ready) return <p className="text-sm text-stone-500">Loading…</p>;
  if (!identity) {
    return (
      <IdentityForm
        title={title}
        description={description}
        bare={bare}
        onSubmit={setIdentity}
      />
    );
  }
  return <>{children(identity, forget)}</>;
}

/** Same spacing as a Card, but no border or background, and centered. */
function BareBox({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-xl">{children}</div>;
}

function IdentityForm({
  title,
  description,
  bare,
  onSubmit,
}: {
  title: string;
  description: string;
  bare?: boolean;
  onSubmit: (identity: Identity) => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Enter your name.");
      return;
    }
    const { email, phone } = parseContact(contact);
    if (!email && !phone) {
      setError("Enter an email address or phone number.");
      return;
    }
    if (email && !isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    setError(null);
    onSubmit({ name: cleanName, email, phone });
  }

  const heading = bare ? "text-center" : "";
  const Box = bare ? BareBox : Card;
  return (
    <Box>
      <h2 className={`font-semibold ${heading}`}>{title}</h2>
      <p className={`mt-1 text-sm text-stone-600 ${heading}`}>{description}</p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={80}
            className={inputClass}
          />
        </Field>
        <Field label="Email or phone number">
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            autoComplete="email"
            inputMode="email"
            maxLength={200}
            className={inputClass}
          />
        </Field>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="flex justify-end">
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Box>
  );
}
