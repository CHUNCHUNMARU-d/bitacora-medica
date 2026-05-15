import { describe, expect, it } from "vitest";
import { currentYearMonth, lastTwelveMonths } from "./dates";

describe("currentYearMonth", () => {
  it("returns YYYY-MM padded", () => {
    expect(currentYearMonth(new Date(2026, 0, 15))).toBe("2026-01");
    expect(currentYearMonth(new Date(2026, 11, 1))).toBe("2026-12");
  });
});

describe("lastTwelveMonths", () => {
  it("returns 12 entries", () => {
    expect(lastTwelveMonths(new Date(2026, 4, 11))).toHaveLength(12);
  });

  it("ends at the supplied month", () => {
    const list = lastTwelveMonths(new Date(2026, 4, 11));
    expect(list[list.length - 1]).toBe("2026-05");
  });

  it("starts 11 months before the supplied month", () => {
    const list = lastTwelveMonths(new Date(2026, 4, 11));
    expect(list[0]).toBe("2025-06");
  });

  it("handles year rollover", () => {
    const list = lastTwelveMonths(new Date(2026, 1, 1));
    expect(list[0]).toBe("2025-03");
    expect(list[list.length - 1]).toBe("2026-02");
  });
});
