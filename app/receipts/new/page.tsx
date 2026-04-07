import Link from "next/link";
import { createReceipt } from "@/app/actions";

export default function NewReceiptPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Back
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">Add receipt</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Upload a photo or PDF. You can refine details on the next screen.
        </p>
      </div>

      <form action={createReceipt} className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="reminderOffsets" value="30,7,1" />

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Purchase</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Merchant</span>
              <input
                name="merchant"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                placeholder="e.g. Apple, Costco"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Purchase date</span>
              <input
                name="purchasedAt"
                type="date"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Total (optional)</span>
              <input
                name="total"
                inputMode="decimal"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                placeholder="1299.00"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Currency</span>
              <input
                name="currency"
                defaultValue="USD"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Primary item (optional)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className="text-zinc-700">Item name</span>
              <input
                name="lineItemName"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                placeholder="e.g. MacBook Pro 14"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Serial (optional)</span>
              <input
                name="lineItemSerial"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">SKU (optional)</span>
              <input
                name="lineItemSku"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Coverage</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Warranty length</span>
              <select
                name="warrantyPreset"
                defaultValue="1y"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              >
                <option value="none">No warranty on file</option>
                <option value="90d">90 days</option>
                <option value="6mo">6 months</option>
                <option value="1y">1 year</option>
                <option value="2y">2 years</option>
                <option value="3y">3 years</option>
                <option value="custom">Custom end date…</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-700">Coverage type</span>
              <select
                name="coverageType"
                defaultValue="manufacturer"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="store">Store</option>
                <option value="extended">Extended</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className="text-zinc-700">Custom coverage end (if selected above)</span>
              <input
                name="coverageEndsCustom"
                type="date"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Files</h2>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-700">Receipt images / PDF</span>
            <input
              name="files"
              type="file"
              multiple
              accept="image/*,.pdf,application/pdf"
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
            />
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Extras</h2>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-700">Manufacturer support / claim URL</span>
            <input
              name="supportUrl"
              type="url"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              placeholder="https://"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-700">Notes</span>
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save receipt
          </button>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
