/** Calendar days until `date` using UTC dates (aligned with stored purchase/coverage dates). */
export function daysUntil(date: Date): number {
  return daysUntilUtc(date);
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
  if (daysLeft < 0) return { label: "Expired", className: "bg-slate-200 text-slate-600" };
  if (daysLeft === 0) return { label: "Ends today", className: "bg-amber-200 text-amber-950" };
  if (daysLeft <= 7) return { label: `Ends in ${daysLeft}d`, className: "bg-amber-100 text-amber-950" };
  if (daysLeft <= 30) return { label: `Ends in ${daysLeft}d`, className: "bg-vault-100 text-vault-900" };
  return { label: `Ends in ${daysLeft}d`, className: "bg-emerald-100 text-emerald-900" };
}

/** Add calendar months on the UTC date (warranty / coverage math). */
export function addMonths(d: Date, months: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const day = d.getUTCDate();
  return new Date(Date.UTC(y, m, day));
}

/** Add calendar years on the UTC date (warranty / coverage math). */
export function addYears(d: Date, years: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate()));
}

/** Add N calendar days on the UTC date. */
export function addDaysUtc(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}
