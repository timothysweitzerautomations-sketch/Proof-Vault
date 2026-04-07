import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { daysUntil, coverageBadge } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await requireUserId();

  const receipts = await prisma.receipt.findMany({
    where: { userId },
    include: { coverage: true },
    orderBy: { updatedAt: "desc" },
  });

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Inbox</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Upcoming warranty endings first. Add a receipt to start tracking claim windows.
        </p>
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-zinc-700">No receipts yet.</p>
          <Link
            href="/receipts/new"
            className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add your first receipt
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {enriched.map((r) => {
            const badge =
              r.daysLeft != null ? coverageBadge(r.daysLeft) : { label: "No coverage", className: "bg-zinc-100 text-zinc-700" };
            return (
              <li key={r.id}>
                <Link
                  href={`/receipts/${r.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">{r.merchant}</p>
                    <p className="truncate text-sm text-zinc-500">
                      Purchased {r.purchasedAt.toLocaleDateString()}
                      {r.totalCents != null ? ` · ${formatMoney(r.totalCents, r.currency)}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
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
