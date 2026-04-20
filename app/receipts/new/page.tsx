import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Link2, Package, Receipt, Shield, StickyNote } from "lucide-react";
import { createReceipt } from "@/app/actions";
import { UsDateField } from "@/components/UsDateField";
import { FilePickArea } from "@/components/FilePickArea";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const label = "text-sm font-medium text-slate-700";
const field =
  "w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none ring-vault-500/20 placeholder:text-slate-400 focus:border-vault-400 focus:ring-2";

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm ring-1 ring-slate-900/[0.04]">
      <div className="flex items-center gap-2.5 border-b border-slate-100/90 bg-gradient-to-r from-vault-50/90 via-white to-white px-5 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-vault-700 shadow-sm ring-1 ring-vault-900/10">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-vault-900/80">{title}</h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export default async function NewReceiptPage() {
  await requireUserId();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-8">
          <div className="relative overflow-hidden rounded-2xl border border-vault-700/10 bg-gradient-to-br from-white via-white to-vault-50/90 p-6 shadow-card sm:p-7">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-vault-400/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-52 rounded-full bg-vault-600/10 blur-3xl" />
            <Link
              href="/"
              className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-vault-800 transition hover:text-vault-950"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
              Back to inbox
            </Link>
            <div className="relative mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-vault-700/75">New entry</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Add receipt</h1>
                <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-slate-600">
                  Capture proof of purchase and warranty details in one pass. You can edit everything after saving.
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5 rounded-full bg-vault-100/80 px-3 py-1.5 text-xs font-medium text-vault-900 ring-1 ring-vault-700/10">
                <span className="rounded-full bg-white px-2 py-0.5 shadow-sm">1 · Details</span>
                <span className="px-2 py-0.5 text-vault-800/70">2 · Refine</span>
              </div>
            </div>
          </div>

          <form action={createReceipt} className="space-y-6">
            <input type="hidden" name="reminderOffsets" value="30,7,1" />

            <SectionCard icon={Receipt} title="Purchase">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className={label}>Merchant</span>
                  <input
                    name="merchant"
                    required
                    className={field}
                    placeholder="e.g. Apple, Costco"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={label}>Purchase date</span>
                  <UsDateField name="purchasedAt" required className={field} />
                </label>
                <label className="block space-y-1.5">
                  <span className={label}>Total (optional)</span>
                  <input name="total" inputMode="decimal" className={field} placeholder="1299.00" />
                </label>
                <label className="block space-y-1.5">
                  <span className={label}>Currency</span>
                  <input name="currency" defaultValue="USD" className={field} />
                </label>
              </div>
            </SectionCard>

            <SectionCard icon={Package} title="Primary item (optional)">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className={label}>Item name</span>
                  <input
                    name="lineItemName"
                    className={field}
                    placeholder="e.g. MacBook Pro 14"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={label}>Serial (optional)</span>
                  <input name="lineItemSerial" className={field} />
                </label>
                <label className="block space-y-1.5">
                  <span className={label}>SKU (optional)</span>
                  <input name="lineItemSku" className={field} />
                </label>
              </div>
            </SectionCard>

            <SectionCard icon={Shield} title="Coverage">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className={label}>Warranty length</span>
                  <select name="warrantyPreset" defaultValue="1y" className={`${field} bg-white`}>
                    <option value="none">No warranty on file</option>
                    <option value="90d">90 days</option>
                    <option value="6mo">6 months</option>
                    <option value="1y">1 year</option>
                    <option value="2y">2 years</option>
                    <option value="3y">3 years</option>
                    <option value="custom">Custom end date…</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className={label}>Coverage type</span>
                  <select name="coverageType" defaultValue="manufacturer" className={`${field} bg-white`}>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="store">Store</option>
                    <option value="extended">Extended</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className={label}>Custom coverage end (if needed)</span>
                  <UsDateField name="coverageEndsCustom" className={field} />
                </label>
              </div>
            </SectionCard>

            <SectionCard icon={Receipt} title="Files">
              <div className="space-y-2">
                <p className={label}>Receipt images / PDF</p>
                <FilePickArea name="files" />
              </div>
            </SectionCard>

            <SectionCard icon={StickyNote} title="Extras">
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className={`inline-flex items-center gap-1.5 ${label}`}>
                    <Link2 className="h-3.5 w-3.5 text-vault-600" aria-hidden />
                    Manufacturer support / claim URL
                  </span>
                  <input name="supportUrl" type="url" className={field} placeholder="https://" />
                </label>
                <label className="block space-y-1.5">
                  <span className={label}>Notes</span>
                  <textarea name="notes" rows={3} className={field} />
                </label>
              </div>
            </SectionCard>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/95 px-5 py-4 shadow-card sm:px-6">
              <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-vault-900">
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-full bg-gradient-to-b from-vault-600 to-vault-700 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-vault-900/20 transition hover:from-vault-500 hover:to-vault-600"
              >
                Save receipt
              </button>
            </div>
          </form>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-vault-700/15 bg-gradient-to-b from-vault-900 to-vault-800 p-5 text-white shadow-xl shadow-vault-900/25">
              <p className="text-xs font-bold uppercase tracking-widest text-vault-200/90">Why it matters</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-vault-50/95">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-vault-300" />
                  Store receipts and warranty end dates together so nothing expires quietly.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-vault-300" />
                  Export a claim pack when you need manufacturer or retailer proof.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-vault-300" />
                  Reminders can nudge you before coverage ends — wire email when you are ready.
                </li>
              </ul>
            </div>
            <p className="rounded-xl border border-dashed border-slate-300/80 bg-white/60 px-4 py-3 text-center text-xs leading-relaxed text-slate-500">
              Fields stay editable after save. Add or swap files anytime from the receipt page.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
