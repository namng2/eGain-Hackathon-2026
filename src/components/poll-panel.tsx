import { amazonSearchUrl } from "@/lib/gift-catalog";
import type { GiftIdea, PollData } from "@/lib/types";
import { Card } from "./ui";

/**
 * The interests poll: top interests, who likes what, and (once sign-ups close)
 * gift ideas. Plain markup with no hooks, so server and client pages can use it.
 */
export function PollPanel({
  poll,
  note,
}: {
  poll: PollData;
  /** Optional line shown above the gift ideas, e.g. when they were generated */
  note?: string;
}) {
  const withInterests = poll.people.filter((p) => p.interests.length > 0);

  return (
    <Card>
      <h2 className="text-lg font-semibold">Interests poll</h2>
      <p className="mt-1 text-sm text-stone-600">
        What people at this event are into. Only names and interests are shown.
      </p>

      {poll.tally.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">No interests have been added yet.</p>
      ) : (
        <>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Top interests">
            {poll.tally.map(({ interest, count }) => (
              <li
                key={interest}
                className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-200"
              >
                <span className="capitalize">{interest}</span>
                <span className="ml-1.5 font-semibold">{count}</span>
              </li>
            ))}
          </ul>

          <ul className="mt-5 divide-y divide-stone-100 text-sm">
            {withInterests.map((person, index) => (
              <li
                key={`${person.name}-${index}`}
                className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4"
              >
                <span className="font-medium text-stone-900 sm:w-40 sm:shrink-0">
                  {person.name}
                </span>
                <span className="capitalize text-stone-600">
                  {person.interests.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {poll.giftIdeas.length > 0 ? (
        <div className="mt-6 border-t border-stone-200 pt-5">
          <h3 className="font-semibold">Gift ideas</h3>
          {note ? <p className="mt-1 text-sm text-stone-500">{note}</p> : null}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {poll.giftIdeas.map((idea) => (
              <GiftIdeaCard key={idea.id} idea={idea} />
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

function GiftIdeaCard({ idea }: { idea: GiftIdea }) {
  return (
    <li className="flex gap-3 rounded-xl border border-stone-200 p-3">
      <div
        aria-hidden="true"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-3xl"
      >
        {idea.emoji}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-stone-900">{idea.title}</p>
        <p className="text-sm text-stone-600">
          About {idea.priceLabel}
          {idea.matchedInterests.length > 0
            ? ` · for ${idea.matchedInterests.join(", ")}`
            : " · budget pick, since no interests were chosen"}
        </p>
        <a
          href={amazonSearchUrl(idea.searchQuery)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm font-medium text-emerald-800 underline underline-offset-2"
        >
          Search on Amazon
        </a>
      </div>
    </li>
  );
}
