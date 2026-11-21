import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-red-700 text-white shadow-sm hover:bg-red-800",
  secondary:
    "bg-white text-stone-800 ring-1 ring-inset ring-stone-300 hover:bg-stone-50",
  danger: "bg-white text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50",
};

/** Use on <Link> or <button> so they look the same. */
export function buttonClasses(variant: ButtonVariant = "primary", extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    extra,
  ]
    .join(" ")
    .trim();
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type={type} className={buttonClasses(variant, className)} {...props} />
  );
}

export const inputClass =
  "mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/25 sm:text-sm";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-stone-800">
      {label}
      {children}
      {hint ? (
        <span className="mt-1 block text-xs font-normal text-stone-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

const toneClasses = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-900",
  info: "border-amber-200 bg-amber-50 text-amber-900",
} as const;

export function Alert({
  tone = "info",
  children,
}: {
  tone?: keyof typeof toneClasses;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${toneClasses[tone]}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: "open" | "closed" }) {
  const open = status === "open";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        open ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"
      }`}
    >
      {open ? "Sign-ups open" : "Sign-ups closed"}
    </span>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">
      {children}
    </p>
  );
}
