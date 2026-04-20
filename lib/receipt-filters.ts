import type { Prisma } from "@prisma/client";

export type CoverageFilter = "any" | "no_coverage" | "active" | "expiring" | "expired";

export function parseCoverageFilter(input: unknown): CoverageFilter {
  if (input === "no_coverage") return "no_coverage";
  if (input === "active") return "active";
  if (input === "expiring") return "expiring";
  if (input === "expired") return "expired";
  return "any";
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function buildCoverageWhere(filter: CoverageFilter): Prisma.ReceiptWhereInput | undefined {
  if (filter === "any") return undefined;

  if (filter === "no_coverage") {
    return { coverage: { is: null } };
  }

  const today = startOfTodayUtc();
  const expiringCutoff = new Date(today);
  expiringCutoff.setUTCDate(expiringCutoff.getUTCDate() + 30);

  if (filter === "expired") {
    return { coverage: { is: { endsAt: { lt: today } } } };
  }

  if (filter === "expiring") {
    return { coverage: { is: { endsAt: { gte: today, lte: expiringCutoff } } } };
  }

  // active
  return { coverage: { is: { endsAt: { gt: expiringCutoff } } } };
}

export function normalizeQuery(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, 80);
}

