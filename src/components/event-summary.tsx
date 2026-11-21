import { formatBudget, formatEventDate } from "@/lib/format";
import type { PublicEvent } from "@/lib/types";
import { Card } from "./ui";

export function EventSummary({ event }: { event: PublicEvent }) {
  const count = event.participantCount;
  return (
    <Card>
      <p className="text-sm font-medium text-green-800">{event.companyName}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">{event.name}</h1>
      <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <Detail label="When" value={formatEventDate(event.date)} />
        <Detail label="Where" value={event.location} />
        <Detail label="Gift budget" value={formatBudget(event.budget)} />
        <Detail label="Steal limit" value={`${event.stealLimit} per gift`} />
        <Detail label="Organized by" value={event.organizerName} />
        <Detail
          label="Signed up"
          value={`${count} ${count === 1 ? "person" : "people"}`}
        />
      </dl>
      {event.rules ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <p className="text-sm font-medium text-stone-500">Rules</p>
          <p className="mt-1 whitespace-pre-line text-sm text-stone-800">
            {event.rules}
          </p>
        </div>
      ) : null}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium text-stone-900">{value}</dd>
    </div>
  );
}
