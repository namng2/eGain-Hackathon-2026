import { avatarColor, initials } from "@/lib/avatar";

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
} as const;

/**
 * A round profile picture, or a colored circle with the person's initials when
 * they haven't added one. The name is shown next to it, so the image is decorative.
 */
export function Avatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url?: string;
  size?: keyof typeof sizes;
}) {
  const base = `${sizes[size]} shrink-0 rounded-full`;
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- private runtime file, not suited to the image optimizer
      <img
        src={url}
        alt=""
        loading="lazy"
        className={`${base} object-cover ring-1 ring-stone-200`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: avatarColor(name) }}
      className={`${base} inline-flex items-center justify-center font-semibold text-white`}
    >
      {initials(name)}
    </span>
  );
}
