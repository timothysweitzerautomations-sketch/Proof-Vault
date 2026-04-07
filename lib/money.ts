export function parseMoneyToCents(input: string | null | undefined): number | null {
  if (input == null || input.trim() === "") return null;
  const n = Number.parseFloat(input.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

export function formatMoney(cents: number | null, currency: string): string {
  if (cents == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
