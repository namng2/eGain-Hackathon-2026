import { Suspense } from "react";
import { PartyBoard } from "@/components/party/party-board";
import { Card } from "@/components/ui";

type Props = { params: Promise<{ code: string }> };

export default function PartyPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <Card>
          <p className="text-sm text-stone-500">Loading party…</p>
        </Card>
      }
    >
      <PartyContent params={params} />
    </Suspense>
  );
}

async function PartyContent({ params }: Props) {
  const { code } = await params;
  return <PartyBoard code={code} />;
}
