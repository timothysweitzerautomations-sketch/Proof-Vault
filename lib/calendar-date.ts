/** Date-only values are stored as UTC midnight for that calendar day (YYYY-MM-DD). */

export function parseDateInput(raw: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

/** Serializes a Date to YYYY-MM-DD using the UTC calendar day (hidden / server). */
export function formatDateInputValue(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Human-readable US-style date for the stored UTC calendar day. */
export function formatLocaleCalendarDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** MM/DD/YYYY for form fields from an ISO YYYY-MM-DD string. */
export function formatUsFromIso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${mo}/${d}/${y}`;
}

/**
 * Parses a form date: ISO `YYYY-MM-DD` or US `M/D/YYYY` / `MM/DD/YYYY` (month first).
 */
export function parseDateFormValue(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return parseDateInput(s);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (us) {
    const month = Number(us[1]);
    const day = Number(us[2]);
    const year = Number(us[3]);
    if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return parseDateInput(iso);
  }
  return null;
}
