import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateInputValue, formatLocaleCalendarDate } from "@/lib/calendar-date";
import { addYears, daysUntil, coverageBadge } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import {
  addLineItem,
  attachFiles,
  deleteLineItem,
  deleteReceipt,
  updateReceipt,
} from "@/app/actions";
import { UsDateField } from "@/components/UsDateField";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

const label = "text-sm font-medium text-slate-700";
const field =
  "w-full rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2.5 text-slate-900 shadow-sm outline-none ring-vault-500/25 focus:border-vault-400 focus:ring-2";
const sectionTitle =
  "text-xs font-bold uppercase tracking-[0.12em] text-vault-800/70";
const card = "rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-card sm:p-7";

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
    daysLeft != null
      ? coverageBadge(daysLeft)
      : { label: "No coverage", className: "bg-slate-100 text-slate-600" };

  const purchasedDateStr = formatDateInputValue(receipt.purchasedAt);
  const coverageStartsStr = receipt.coverage
    ? formatDateInputValue(receipt.coverage.startsAt)
    : purchasedDateStr;
  const defaultEndIfMissing = formatDateInputValue(addYears(receipt.purchasedAt, 1));
  const coverageEndsStr = receipt.coverage
    ? formatDateInputValue(receipt.coverage.endsAt)
    : defaultEndIfMissing;
  const reminderStr =
    receipt.reminders.length > 0 ? receipt.reminders.map((r) => r.offsetDays).join(",") : "30,7,1";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-vault-800 transition hover:text-vault-950"
          >
            ← Inbox
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{receipt.merchant}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Purchased {formatLocaleCalendarDate(receipt.purchasedAt)}
            {receipt.totalCents != null ? ` · ${formatMoney(receipt.totalCents, receipt.currency)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/receipts/${receipt.id}/claim-pack`}
            rel="nofollow"
            className="inline-flex rounded-full bg-gradient-to-b from-slate-800 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-slate-700 hover:to-slate-800"
          >
            Export claim pack (PDF)
          </a>
        </div>
      </div>

      <section className={card}>
        <h2 className={sectionTitle}>Edit details</h2>
        <form action={updateReceipt.bind(null, receipt.id)} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={label}>Merchant</span>
              <input name="merchant" required defaultValue={receipt.merchant} className={field} />
            </label>
            <label className="block space-y-1.5">
              <span className={label}>Purchase date</span>
              <UsDateField name="purchasedAt" required defaultIso={purchasedDateStr} className={field} />
            </label>
            <label className="block space-y-1.5">
              <span className={label}>Total</span>
              <input
                name="total"
                inputMode="decimal"
                defaultValue={
                  receipt.totalCents != null ? (receipt.totalCents / 100).toFixed(2) : ""
                }
                className={field}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={label}>Currency</span>
              <input name="currency" defaultValue={receipt.currency} className={field} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={label}>Coverage starts</span>
              <UsDateField
                name="coverageStarts"
                required={!!receipt.coverage}
                defaultIso={coverageStartsStr}
                className={field}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={label}>Coverage ends</span>
              <UsDateField
                name="coverageEnds"
                required={!!receipt.coverage}
                defaultIso={coverageEndsStr}
                className={field}
              />
            </label>
            <label className="block space-y-1.5 sm:col-span-2">
              <span className={label}>Coverage type</span>
              <select
                name="coverageType"
                defaultValue={receipt.coverage?.type ?? "unknown"}
                className={`${field} bg-white`}
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="store">Store</option>
                <option value="extended">Extended</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <label className="block space-y-1.5 sm:col-span-2">
              <span className={label}>Reminder offsets (days before coverage ends)</span>
              <input
                name="reminderOffsets"
                defaultValue={reminderStr}
                className={`${field} font-mono text-sm`}
                placeholder="30,7,1"
              />
              <span className="text-xs text-slate-500">Comma-separated. Email delivery can be wired later.</span>
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className={label}>Support / claim URL</span>
            <input
              name="supportUrl"
              type="url"
              defaultValue={receipt.supportUrl ?? ""}
              className={field}
            />
          </label>
          <label className="block space-y-1.5">
            <span className={label}>Notes</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={receipt.notes ?? ""}
              className={field}
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-gradient-to-b from-vault-600 to-vault-700 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-vault-900/15 transition hover:from-vault-500 hover:to-vault-600"
          >
            Save changes
          </button>
        </form>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Attachments</h2>
        {receipt.files.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No files yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {receipt.files.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm"
              >
                <a
                  href={`/api/receipt-files/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-vault-800 hover:underline"
                >
                  {f.originalName}
                </a>
                <span className="text-slate-500">{f.mimeType}</span>
              </li>
            ))}
          </ul>
        )}
        <form action={attachFiles.bind(null, receipt.id)} className="mt-5 space-y-3">
          <input
            name="files"
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            className="w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-slate-300"
          />
          <button
            type="submit"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Upload more
          </button>
        </form>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Line items</h2>
        {receipt.lineItems.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No line items.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/30">
            {receipt.lineItems.map((li) => (
              <li
                key={li.id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 text-sm first:rounded-t-xl last:rounded-b-xl"
              >
                <div>
                  <p className="font-semibold text-slate-900">{li.name}</p>
                  <p className="text-slate-600">
                    ×{li.quantity}
                    {li.priceCents != null ? ` · ${formatMoney(li.priceCents, receipt.currency)}` : ""}
                    {li.sku ? ` · SKU ${li.sku}` : ""}
                    {li.serial ? ` · Serial ${li.serial}` : ""}
                  </p>
                </div>
                <form action={deleteLineItem.bind(null, li.id, receipt.id)}>
                  <button type="submit" className="text-xs font-semibold text-red-600 hover:text-red-700">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addLineItem.bind(null, receipt.id)} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className={label}>Add item name</span>
            <input name="name" required className={field} />
          </label>
          <label className="block space-y-1.5">
            <span className={label}>Qty</span>
            <input name="quantity" type="number" min={1} defaultValue={1} className={field} />
          </label>
          <label className="block space-y-1.5">
            <span className={label}>Price</span>
            <input name="price" inputMode="decimal" className={field} />
          </label>
          <label className="block space-y-1.5">
            <span className={label}>SKU</span>
            <input name="sku" className={field} />
          </label>
          <label className="block space-y-1.5">
            <span className={label}>Serial</span>
            <input name="serial" className={field} />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Add line item
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/90 to-white p-6 shadow-sm sm:p-7">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-red-800/90">Danger zone</h2>
        <p className="mt-2 text-sm text-red-900/85">
          Deletes this receipt, coverage, and database file records.
        </p>
        <form action={deleteReceipt.bind(null, receipt.id)} className="mt-4">
          <button
            type="submit"
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Delete receipt
          </button>
        </form>
      </section>
    </div>
  );
}
