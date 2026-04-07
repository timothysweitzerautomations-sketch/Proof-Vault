export function daysUntil(date: Date): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/** Calendar days from today (UTC) to end date (UTC). Used for cron-driven reminders. */
export function daysUntilUtc(end: Date): number {
  const today = new Date();
  const t0 = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const t1 = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.ceil((t1 - t0) / (1000 * 60 * 60 * 24));
}

export function utcDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function coverageBadge(daysLeft: number): { label: string; className: string } {
  if (daysLeft < 0) return { label: "Expired", className: "bg-zinc-200 text-zinc-700" };
  if (daysLeft === 0) return { label: "Ends today", className: "bg-amber-200 text-amber-900" };
  if (daysLeft <= 7) return { label: `Ends in ${daysLeft}d`, className: "bg-amber-100 text-amber-900" };
  if (daysLeft <= 30) return { label: `Ends in ${daysLeft}d`, className: "bg-sky-100 text-sky-900" };
  return { label: `Ends in ${daysLeft}d`, className: "bg-emerald-100 text-emerald-900" };
}

export function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

export function addYears(d: Date, years: number): Date {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + years);
  return x;
}
