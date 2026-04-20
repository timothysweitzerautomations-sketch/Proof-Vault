import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatLocaleCalendarDate } from "@/lib/calendar-date";
import { daysUntil, coverageBadge } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUserId } from "@/lib/session";
import { buildCoverageWhere, normalizeQuery, parseCoverageFilter } from "@/lib/receipt-filters";
import { LogoMark } from "@/components/LogoMark";

export const dynamic = "force-dynamic";

const inputFocus =
  "outline-none ring-vault-500/25 focus:border-vault-400 focus:ring-2 focus:ring-offset-0";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();

  const sp = (await searchParams) ?? {};
  const q = normalizeQuery(Array.isArray(sp.q) ? sp.q[0] : sp.q);
  const coverage = parseCoverageFilter(Array.isArray(sp.coverage) ? sp.coverage[0] : sp.coverage);

  const coverageWhere = buildCoverageWhere(coverage);
  const filtersActive = q.length > 0 || coverage !== "any";

  const [totalReceipts, receipts] = await Promise.all([
    prisma.receipt.count({ where: { userId } }),
    prisma.receipt.findMany({
      where: {
        userId,
        ...(q
          ? {
              OR: [
                { merchant: { contains: q, mode: "insensitive" } },
                { notes: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(coverageWhere ?? {}),
      },
      include: { coverage: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const enriched = receipts.map((r) => ({
    ...r,
    daysLeft: r.coverage ? daysUntil(r.coverage.endsAt) : null,
  }));

  enriched.sort((a, b) => {
    if (a.daysLeft == null && b.daysLeft == null) return 0;
    if (a.daysLeft == null) return 1;
    if (b.daysLeft == null) return -1;
    return a.daysLeft - b.daysLeft;
  });

  const countLabel =
    enriched.length === 1 ? "1 receipt" : `${enriched.length} receipts`;
  const filteredSummary =
    filtersActive && totalReceipts > enriched.length
      ? `Showing ${countLabel} of ${totalReceipts} total`
      : countLabel;

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-vault-700/10 bg-gradient-to-br from-white via-white to-vault-50/80 p-6 shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-vault-400/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-24 w-48 rounded-full bg-vault-600/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-vault-700/80">Your desk</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Inbox</h1>
            <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-slate-600">
              Warranties ending soon rise to the top. Add a receipt to keep claim windows within reach.
            </p>
          </div>
          <Link
            href="/receipts/new"
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-vault-600 to-vault-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-vault-900/20 transition hover:from-vault-500 hover:to-vault-600 ${inputFocus}`}
          >
            New receipt
          </Link>
        </div>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex-1">
            <span className="sr-only">Search receipts</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search merchant or notes…"
              className={`h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 ${inputFocus}`}
            />
          </label>
          <label>
            <span className="sr-only">Coverage filter</span>
            <select
              name="coverage"
              defaultValue={coverage}
              className={`h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 text-sm text-slate-800 shadow-sm ${inputFocus}`}
            >
              <option value="any">All</option>
              <option value="no_coverage">No coverage</option>
              <option value="active">Active (30d+)</option>
              <option value="expiring">Expiring (0–30d)</option>
              <option value="expired">Expired</option>
            </select>
          </label>
          <button
            type="submit"
            className={`h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 ${inputFocus}`}
          >
            Filter
          </button>
          {(q || coverage !== "any") && (
            <Link
              href="/"
              className={`h-11 rounded-xl border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 ${inputFocus}`}
            >
              Clear
            </Link>
          )}
        </form>
        {enriched.length > 0 && (
          <p className="mt-4 text-sm text-slate-600" aria-live="polite">
            {filteredSummary}
          </p>
        )}
      </div>

      {enriched.length === 0 && filtersActive && totalReceipts > 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/60 px-6 py-12 text-center shadow-card sm:py-14">
          <p className="text-lg font-medium text-slate-800">No receipts match your filters</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Try a different search term or coverage option, or clear filters to see all {totalReceipts} receipt
            {totalReceipts === 1 ? "" : "s"}.
          </p>
          <Link
            href="/"
            className={`mt-6 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 ${inputFocus}`}
          >
            Clear filters
          </Link>
        </div>
      ) : enriched.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-vault-300/60 bg-white/60 px-6 py-14 text-center shadow-card sm:py-16">
          <LogoMark
            gradientId="pv-logo-inbox"
            className="mx-auto h-14 w-14 opacity-90 shadow-md shadow-vault-900/10"
          />
          <p className="mt-5 text-lg font-medium text-slate-800">Nothing in your vault yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Snap a photo or upload a PDF — we will track coverage dates alongside the proof.
          </p>
          <Link
            href="/receipts/new"
            className={`mt-6 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 ${inputFocus}`}
          >
            Add your first receipt
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {enriched.map((r) => {
            const badge =
              r.daysLeft != null
                ? coverageBadge(r.daysLeft)
                : { label: "No coverage", className: "bg-slate-100 text-slate-600" };
            return (
              <li key={r.id}>
                <Link
                  href={`/receipts/${r.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-vault-200 hover:shadow-card-hover sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 group-hover:text-vault-900">{r.merchant}</p>
                    <p className="truncate text-sm text-slate-500">
                      Purchased {formatLocaleCalendarDate(r.purchasedAt)}
                      {r.totalCents != null ? ` · ${formatMoney(r.totalCents, r.currency)}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
