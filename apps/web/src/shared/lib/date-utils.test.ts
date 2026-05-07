import { describe, it, expect } from "vitest";
import { toDate, safeFormat } from "./date-utils";

const FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC",
});

describe("toDate", () => {
  it("returns null for nullish/empty", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate("")).toBeNull();
  });

  it("returns same Date object when given a valid Date", () => {
    const d = new Date("2026-05-07T10:00:00Z");
    expect(toDate(d)).toBe(d);
  });

  it("parses ISO string", () => {
    const d = toDate("2026-05-07T10:00:00Z");
    expect(d).toBeInstanceOf(Date);
    expect(d?.toISOString()).toBe("2026-05-07T10:00:00.000Z");
  });

  it("returns null for invalid date string", () => {
    expect(toDate("not-a-date")).toBeNull();
  });

  it("returns null for invalid Date object", () => {
    expect(toDate(new Date("invalid"))).toBeNull();
  });
});

describe("safeFormat", () => {
  it("formats valid Date", () => {
    expect(safeFormat(new Date("2026-05-07T00:00:00Z"), FMT)).toBe(
      "05/07/2026",
    );
  });

  it("formats valid ISO string", () => {
    expect(safeFormat("2026-05-07T00:00:00Z", FMT)).toBe("05/07/2026");
  });

  it("returns default fallback for null", () => {
    expect(safeFormat(null, FMT)).toBe("-");
  });

  it("returns custom fallback for invalid input", () => {
    expect(safeFormat("garbage", FMT, "—")).toBe("—");
    expect(safeFormat(undefined, FMT, "")).toBe("");
  });
});
