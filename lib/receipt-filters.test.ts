import { describe, expect, it } from "vitest";
import { buildCoverageWhere, normalizeQuery, parseCoverageFilter } from "./receipt-filters";

describe("parseCoverageFilter", () => {
  it("defaults to any for unknown values", () => {
    expect(parseCoverageFilter(undefined)).toBe("any");
    expect(parseCoverageFilter("")).toBe("any");
    expect(parseCoverageFilter("something-else")).toBe("any");
  });

  it("accepts known values", () => {
    expect(parseCoverageFilter("no_coverage")).toBe("no_coverage");
    expect(parseCoverageFilter("active")).toBe("active");
    expect(parseCoverageFilter("expiring")).toBe("expiring");
    expect(parseCoverageFilter("expired")).toBe("expired");
  });
});

describe("normalizeQuery", () => {
  it("trims and caps length", () => {
    expect(normalizeQuery("  walmart ")).toBe("walmart");
    expect(normalizeQuery("")).toBe("");
    expect(normalizeQuery(123)).toBe("");
    expect(normalizeQuery("a".repeat(200))).toHaveLength(80);
  });
});

describe("buildCoverageWhere", () => {
  it("returns undefined for any", () => {
    expect(buildCoverageWhere("any")).toBeUndefined();
  });

  it("builds a coverage null filter", () => {
    expect(buildCoverageWhere("no_coverage")).toEqual({ coverage: { is: null } });
  });

  it("builds filters for covered receipts", () => {
    // We only assert the shape; exact dates depend on 'now' so we avoid brittle tests.
    expect(buildCoverageWhere("expired")).toHaveProperty("coverage.is.endsAt.lt");
    expect(buildCoverageWhere("expiring")).toHaveProperty("coverage.is.endsAt.gte");
    expect(buildCoverageWhere("expiring")).toHaveProperty("coverage.is.endsAt.lte");
    expect(buildCoverageWhere("active")).toHaveProperty("coverage.is.endsAt.gt");
  });
});

