"use client";

import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Button, Card } from "@/components/ui";

export default function NewPartyPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Start a gift party</h1>
        <p className="mt-1 text-sm text-stone-600">
          Add each player and the gift they&apos;re bringing, then unwrap and steal.
        </p>
      </div>
      <Card>
        <Button onClick={() => router.push(`/party/${nanoid(8)}`)}>
          Create a party
        </Button>
      </Card>
    </div>
  );
}
