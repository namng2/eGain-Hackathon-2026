import { tileGradient } from "@/lib/tile-color";

/**
 * An illustrated tile for a gift: a soft gradient (same colors every time for
 * the same gift) with a large emoji. Plain markup with no hooks, so server and
 * client pages can both use it.
 */
export function GiftTile({ title, emoji }: { title: string; emoji: string }) {
  const { from, to } = tileGradient(title);
  return (
    <div
      aria-hidden="true"
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      className="relative flex h-20 w-20 shrink-0 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-2xl shadow-inner ring-1 ring-black/5"
    >
      <span className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/40" />
      <span className="absolute -bottom-5 -left-5 h-14 w-14 rounded-full bg-white/30" />
      <span className="relative text-4xl drop-shadow-sm sm:text-5xl">{emoji}</span>
    </div>
  );
}
