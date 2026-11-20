import { Suspense } from "react";
import { ChatView } from "@/components/chat-panel";

type Props = { params: Promise<{ eventId: string }> };

/** Group chat for an event. The page is public, but the messages need a signed-up name + email. */
export default function ChatPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
      <ChatLoader params={params} />
    </Suspense>
  );
}

async function ChatLoader({ params }: Props) {
  const { eventId } = await params;
  return <ChatView eventId={eventId} />;
}
