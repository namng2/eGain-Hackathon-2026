/**
 * Event dates are stored as wall-clock strings ("2026-12-18T12:00") with no
 * timezone. Formatting them in UTC keeps the displayed time identical on the
 * server, in the browser, and in every timezone.
 */
export function formatEventDate(raw: string): string {
  const date = new Date(`${raw}Z`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatBudget(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatJoinedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function attendanceLabel(value: "in_person" | "remote"): string {
  return value === "in_person" ? "In person" : "Remote";
}
