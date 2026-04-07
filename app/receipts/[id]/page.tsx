import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addYears, daysUntil, coverageBadge } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import {
  addLineItem,
  attachFiles,
  deleteLineItem,
  deleteReceipt,
  updateReceipt,
} from "@/app/actions";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ReceiptDetailPage(props: PageProps) {
  const userId = await requireUserId();
  const { id } = await props.params;
  const receipt = await prisma.receipt.findFirst({
    where: { id, userId },
    include: { lineItems: true, files: true, coverage: true, reminders: true },
  });

  if (!receipt) notFound();

  const daysLeft = receipt.coverage ? daysUntil(receipt.coverage.endsAt) : null;
  const badge =
    daysLeft != null ? coverageBadge(daysLeft) : { label: "No coverage", className: "bg-zinc-100 text-zinc-700" };

  const purchasedDateStr = receipt.purchasedAt.toISOString().slice(0, 10);
  const coverageStartsStr = receipt.coverage
    ? receipt.coverage.startsAt.toISOString().slice(0, 10)
    : purchasedDateStr;
  const defaultEndIfMissing = addYears(receipt.purchasedAt, 1).toISOString().slice(0, 10);
  const coverageEndsStr = receipt.coverage
    ? receipt.coverage.endsAt.toISOString().slice(0, 10)
    : defaultEndIfMissing;
  const reminderStr =
    receipt.reminders.length > 0 ? receipt.reminders.map((r) => r.offsetDays).join(",") : "30,7,1";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Inbox
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{receipt.merchant}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            Purchased {receipt.purchasedAt.toLocaleDateString()}
            {receipt.totalCents != null ? ` · ${formatMoney(receipt.totalCents, receipt.currency)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/receipts/${receipt.id}/claim-pack`}
            rel="nofollow"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Export claim pack (PDF)
          </a>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Edit details</h2>
        <form action={updateReceipt.bind(null, receipt.id)} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Merchant</span>
              <input
                name="merchant"
                required
                defaultValue={receipt.merchant}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Purchase date</span>
              <input
                name="purchasedAt"
                type="date"
                required
                defaultValue={purchasedDateStr}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Total</span>
              <input
                name="total"
                inputMode="decimal"
                defaultValue={
                  receipt.totalCents != null ? (receipt.totalCents / 100).toFixed(2) : ""
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Currency</span>
              <input
                name="currency"
                defaultValue={receipt.currency}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Coverage starts</span>
              <input
                name="coverageStarts"
                type="date"
                required={!!receipt.coverage}
                defaultValue={coverageStartsStr}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Coverage ends</span>
              <input
                name="coverageEnds"
                type="date"
                required={!!receipt.coverage}
                defaultValue={coverageEndsStr}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className="text-zinc-700">Coverage type</span>
              <select
                name="coverageType"
                defaultValue={receipt.coverage?.type ?? "unknown"}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="store">Store</option>
                <option value="extended">Extended</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className="text-zinc-700">Reminder offsets (days before coverage ends)</span>
              <input
                name="reminderOffsets"
                defaultValue={reminderStr}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                placeholder="30,7,1"
              />
              <span className="text-xs text-zinc-500">Comma-separated. Email/push delivery can be wired later.</span>
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-700">Support / claim URL</span>
            <input
              name="supportUrl"
              type="url"
              defaultValue={receipt.supportUrl ?? ""}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-700">Notes</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={receipt.notes ?? ""}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save changes
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Attachments</h2>
        {receipt.files.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">No files yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {receipt.files.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 text-sm">
                <a
                  href={`/api/receipt-files/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-sky-700 hover:underline"
                >
                  {f.originalName}
                </a>
                <span className="text-zinc-500">{f.mimeType}</span>
              </li>
            ))}
          </ul>
        )}
        <form action={attachFiles.bind(null, receipt.id)} className="mt-4 space-y-2">
          <input
            name="files"
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-300"
          />
          <button
            type="submit"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Upload more
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Line items</h2>
        {receipt.lineItems.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">No line items.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {receipt.lineItems.map((li) => (
              <li key={li.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-zinc-900">{li.name}</p>
                  <p className="text-zinc-600">
                    ×{li.quantity}
                    {li.priceCents != null ? ` · ${formatMoney(li.priceCents, receipt.currency)}` : ""}
                    {li.sku ? ` · SKU ${li.sku}` : ""}
                    {li.serial ? ` · Serial ${li.serial}` : ""}
                  </p>
                </div>
                <form action={deleteLineItem.bind(null, li.id, receipt.id)}>
                  <button
                    type="submit"
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addLineItem.bind(null, receipt.id)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="text-zinc-700">Add item name</span>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-700">Qty</span>
            <input
              name="quantity"
              type="number"
              min={1}
              defaultValue={1}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-700">Price</span>
            <input
              name="price"
              inputMode="decimal"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-700">SKU</span>
            <input
              name="sku"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-700">Serial</span>
            <input
              name="serial"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Add line item
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-800">Danger zone</h2>
        <p className="mt-2 text-sm text-red-900/80">Deletes this receipt, coverage, and database file records.</p>
        <form action={deleteReceipt.bind(null, receipt.id)} className="mt-4">
          <button
            type="submit"
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete receipt
          </button>
        </form>
      </section>
    </div>
  );
}
