"use client";

import { INTERESTS } from "@/lib/gift-catalog";

export const MAX_PICKS = 8;

/** Toggle chips for choosing interests from the fixed list. */
export function InterestPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const full = value.length >= MAX_PICKS;

  function toggle(interest: string) {
    onChange(
      value.includes(interest)
        ? value.filter((v) => v !== interest)
        : [...value, interest],
    );
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-stone-800">
        Interests and hobbies (optional)
      </legend>
      <p className="mt-1 text-xs text-stone-500">
        Pick up to {MAX_PICKS}. Everyone at the event can see them, and the app
        uses what the group picks to suggest gifts.{" "}
        <span aria-live="polite">
          {value.length} of {MAX_PICKS} picked.
        </span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {INTERESTS.map((interest) => {
          const checked = value.includes(interest);
          return (
            <label key={interest} className="cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                disabled={!checked && full}
                onChange={() => toggle(interest)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full bg-white px-3 py-1 text-sm capitalize text-stone-700 ring-1 ring-inset ring-stone-300 transition-colors hover:bg-stone-50 peer-checked:bg-emerald-700 peer-checked:text-white peer-checked:ring-emerald-700 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-40">
                {interest}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
