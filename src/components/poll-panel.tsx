import type { ReactNode } from "react";
import { amazonSearchUrl } from "@/lib/gift-catalog";
import type { GiftIdea, PollData } from "@/lib/types";
import { GiftTile } from "./gift-tile";
import { Card, buttonClasses } from "./ui";

/**
 * The interests poll: top interests, who likes what, and (once sign-ups close)
 * gift ideas. Plain markup with no hooks, so server and client pages can use it.
 */
export function PollPanel({
  poll,
  note,
  actions,
}: {
  poll: PollData;
  /** Optional line shown above the gift ideas, e.g. when they were generated */
  note?: string;
  /** Optional controls shown beside the "Gift ideas" heading, e.g. a Regenerate button */
  actions?: ReactNode;
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">Gift ideas</h3>
              <p className="mt-0.5 text-sm font-medium text-stone-600">
                {poll.giftIdeasSource === "ai"
                  ? "✨ Ideas by Claude, based on what your group picked"
                  : "Picked by our matching algorithm"}
              </p>
              {note ? <p className="mt-1 text-sm text-stone-500">{note}</p> : null}
            </div>
            {actions}
          </div>
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
    <li className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:gap-4">
      <GiftTile title={idea.title} emoji={idea.emoji} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold leading-snug text-stone-900">{idea.title}</p>
          <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
            ~{idea.priceLabel}
          </span>
        </div>

        <p className="mt-1 text-sm text-stone-600">
          {idea.why ??
            (idea.matchedInterests.length > 0
              ? `A match for ${idea.matchedInterests.join(", ")}.`
              : "A budget pick, since no interests were chosen.")}
        </p>

        {idea.matchedInterests.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Matches these interests">
            {idea.matchedInterests.map((interest) => (
              <li
                key={interest}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs capitalize text-emerald-900 ring-1 ring-inset ring-emerald-200"
              >
                {interest}
              </li>
            ))}
          </ul>
        ) : null}

        <a
          href={amazonSearchUrl(idea.searchQuery)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("secondary", "mt-auto self-start whitespace-nowrap pt-2")}
        >
          Search on Amazon
        </a>
      </div>
    </li>
  );
}
