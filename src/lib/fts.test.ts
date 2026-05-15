import { describe, expect, it } from "vitest";
import { ftsQuery } from "./fts";

describe("ftsQuery", () => {
  it("returns empty for blank input", () => {
    expect(ftsQuery("")).toBe("");
    expect(ftsQuery("   ")).toBe("");
  });

  it("wraps a single token in quotes with prefix wildcard", () => {
    expect(ftsQuery("rodilla")).toBe('"rodilla"*');
  });

  it("joins multiple tokens with AND", () => {
    expect(ftsQuery("rodilla derecha")).toBe('"rodilla"* AND "derecha"*');
  });

  it("collapses internal whitespace", () => {
    expect(ftsQuery("  artroscopia   rodilla  ")).toBe(
      '"artroscopia"* AND "rodilla"*',
    );
  });

  it("strips embedded double quotes", () => {
    expect(ftsQuery('frac"tura')).toBe('"fractura"*');
  });

  it("drops tokens that become empty after stripping quotes", () => {
    expect(ftsQuery('"" rodilla')).toBe('"rodilla"*');
  });
});
