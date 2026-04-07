"use server";

import { prisma } from "@/lib/prisma";
import { parseMoneyToCents } from "@/lib/money";
import { storeUpload, removeUpload } from "@/lib/storage";
import { addDaysUtc, addMonths, addYears } from "@/lib/dates";
import { parseDateFormValue } from "@/lib/calendar-date";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { assertReceiptOwned } from "@/lib/receipt-access";

const DEFAULT_REMINDERS = [30, 7, 1];

function warrantyEndFromPreset(
  purchasedAt: Date,
  preset: string,
  customEnd: string | null
): Date | null {
  if (preset === "none") return null;
  if (preset === "custom" && customEnd) {
    return parseDateFormValue(customEnd);
  }
  if (preset === "90d") {
    return addDaysUtc(purchasedAt, 90);
  }
  if (preset === "1y") return addYears(purchasedAt, 1);
  if (preset === "2y") return addYears(purchasedAt, 2);
  if (preset === "3y") return addYears(purchasedAt, 3);
  if (preset === "6mo") return addMonths(purchasedAt, 6);
  return null;
}

function parseReminderOffsets(formData: FormData): number[] {
  const raw = formData.get("reminderOffsets");
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n >= 0);
  }
  return [...DEFAULT_REMINDERS];
}

export async function createReceipt(formData: FormData) {
  const userId = await requireUserId();

  const merchant = String(formData.get("merchant") ?? "").trim();
  if (!merchant) {
    throw new Error("Merchant is required.");
  }

  const purchasedAtRaw = String(formData.get("purchasedAt") ?? "");
  const purchasedAt = parseDateFormValue(purchasedAtRaw);
  if (!purchasedAt) {
    throw new Error("Purchase date is invalid.");
  }

  const currency = String(formData.get("currency") ?? "USD").trim() || "USD";
  const totalCents = parseMoneyToCents(String(formData.get("total") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const supportUrl = String(formData.get("supportUrl") ?? "").trim() || null;

  const warrantyPreset = String(formData.get("warrantyPreset") ?? "1y");
  const customEnd = String(formData.get("coverageEndsCustom") ?? "").trim() || null;
  const coverageEnd = warrantyEndFromPreset(purchasedAt, warrantyPreset, customEnd);
  const coverageType = String(formData.get("coverageType") ?? "unknown").trim() || "unknown";

  const lineName = String(formData.get("lineItemName") ?? "").trim();
  const lineSerial = String(formData.get("lineItemSerial") ?? "").trim() || null;
  const lineSku = String(formData.get("lineItemSku") ?? "").trim() || null;

  const reminderOffsets = parseReminderOffsets(formData);

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  const receipt = await prisma.$transaction(async (tx) => {
    const r = await tx.receipt.create({
      data: {
        userId,
        merchant,
        purchasedAt,
        currency,
        totalCents,
        notes,
        supportUrl,
        lineItems:
          lineName.length > 0
            ? {
                create: {
                  name: lineName,
                  quantity: 1,
                  serial: lineSerial,
                  sku: lineSku,
                },
              }
            : undefined,
        coverage: coverageEnd
          ? {
              create: {
                startsAt: purchasedAt,
                endsAt: coverageEnd,
                type: coverageType,
              },
            }
          : undefined,
        reminders:
          reminderOffsets.length > 0
            ? {
                create: reminderOffsets.map((offsetDays) => ({ offsetDays })),
              }
            : undefined,
      },
    });

    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const { storedPath } = await storeUpload(buf, file.name, file.type || "application/octet-stream");
      await tx.receiptFile.create({
        data: {
          receiptId: r.id,
          storedPath,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
        },
      });
    }

    return r;
  });

  revalidatePath("/");
  redirect(`/receipts/${receipt.id}`);
}

export async function updateReceipt(receiptId: string, formData: FormData): Promise<void> {
  const userId = await requireUserId();
  await assertReceiptOwned(userId, receiptId);

  const merchant = String(formData.get("merchant") ?? "").trim();
  if (!merchant) throw new Error("Merchant is required.");

  const purchasedAtRaw = String(formData.get("purchasedAt") ?? "");
  const purchasedAt = parseDateFormValue(purchasedAtRaw);
  if (!purchasedAt) throw new Error("Purchase date is invalid.");

  const currency = String(formData.get("currency") ?? "USD").trim() || "USD";
  const totalCents = parseMoneyToCents(String(formData.get("total") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const supportUrl = String(formData.get("supportUrl") ?? "").trim() || null;

  const coverageStartsRaw = String(formData.get("coverageStarts") ?? "");
  const coverageEndsRaw = String(formData.get("coverageEnds") ?? "");
  const coverageStarts = parseDateFormValue(coverageStartsRaw);
  const coverageEnds = parseDateFormValue(coverageEndsRaw);
  const coverageType = String(formData.get("coverageType") ?? "unknown").trim() || "unknown";

  const reminderOffsets = parseReminderOffsets(formData);

  await prisma.$transaction(async (tx) => {
    await tx.receipt.update({
      where: { id: receiptId, userId },
      data: {
        merchant,
        purchasedAt,
        currency,
        totalCents,
        notes,
        supportUrl,
      },
    });

    const existingCoverage = await tx.coverage.findUnique({ where: { receiptId } });
    if (coverageStarts && coverageEnds) {
      if (existingCoverage) {
        await tx.coverage.update({
          where: { receiptId },
          data: {
            startsAt: coverageStarts,
            endsAt: coverageEnds,
            type: coverageType,
          },
        });
      } else {
        await tx.coverage.create({
          data: {
            receiptId,
            startsAt: coverageStarts,
            endsAt: coverageEnds,
            type: coverageType,
          },
        });
      }
    } else if (existingCoverage) {
      await tx.coverage.delete({ where: { receiptId } });
    }

    await tx.reminder.deleteMany({ where: { receiptId } });
    if (reminderOffsets.length > 0) {
      await tx.reminder.createMany({
        data: reminderOffsets.map((offsetDays) => ({ receiptId, offsetDays })),
      });
    }
  });

  revalidatePath("/");
  revalidatePath(`/receipts/${receiptId}`);
}

export async function addLineItem(receiptId: string, formData: FormData): Promise<void> {
  const userId = await requireUserId();
  await assertReceiptOwned(userId, receiptId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Item name is required.");

  const quantity = Math.max(1, Number.parseInt(String(formData.get("quantity") ?? "1"), 10) || 1);
  const priceCents = parseMoneyToCents(String(formData.get("price") ?? ""));
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const serial = String(formData.get("serial") ?? "").trim() || null;

  await prisma.lineItem.create({
    data: {
      receiptId,
      name,
      quantity,
      priceCents: priceCents,
      sku,
      serial,
    },
  });

  revalidatePath(`/receipts/${receiptId}`);
}

export async function deleteLineItem(lineItemId: string, receiptId: string): Promise<void> {
  const userId = await requireUserId();
  await assertReceiptOwned(userId, receiptId);

  const line = await prisma.lineItem.findFirst({
    where: { id: lineItemId, receiptId, receipt: { userId } },
    select: { id: true },
  });
  if (!line) throw new Error("Line item not found.");
  await prisma.lineItem.delete({ where: { id: lineItemId } });

  revalidatePath(`/receipts/${receiptId}`);
}

export async function attachFiles(receiptId: string, formData: FormData): Promise<void> {
  const userId = await requireUserId();
  await assertReceiptOwned(userId, receiptId);

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const { storedPath } = await storeUpload(buf, file.name, file.type || "application/octet-stream");
      await tx.receiptFile.create({
        data: {
          receiptId,
          storedPath,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
        },
      });
    }
  });

  revalidatePath(`/receipts/${receiptId}`);
}

export async function deleteReceipt(receiptId: string): Promise<void> {
  const userId = await requireUserId();
  await assertReceiptOwned(userId, receiptId);

  const files = await prisma.receiptFile.findMany({ where: { receiptId } });
  await prisma.receipt.delete({ where: { id: receiptId, userId } });
  for (const f of files) {
    await removeUpload(f.storedPath);
  }
  revalidatePath("/");
  redirect("/");
}
