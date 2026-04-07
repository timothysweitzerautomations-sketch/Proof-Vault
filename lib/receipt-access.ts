import { prisma } from "@/lib/prisma";

export async function assertReceiptOwned(userId: string, receiptId: string): Promise<void> {
  const row = await prisma.receipt.findFirst({
    where: { id: receiptId, userId },
    select: { id: true },
  });
  if (!row) throw new Error("Receipt not found.");
}
