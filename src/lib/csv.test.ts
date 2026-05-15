import { describe, expect, it } from "vitest";
import { escapeCsv, rowsToCsv } from "./csv";
import type { Cirugia } from "./types";

const sample: Cirugia = {
  id: 1,
  fecha_cirugia: "2026-05-10",
  nombre_paciente: "Juan Pérez",
  edad: 42,
  sexo: "M",
  nss: "12345",
  diagnostico: "Fractura tibia",
  procedimiento_quirurgico: "Osteosíntesis",
  rol_cirujano: "Cirujano titular",
  observaciones: null,
  created_at: "2026-05-10T10:00:00Z",
  updated_at: "2026-05-10T10:00:00Z",
};

describe("escapeCsv", () => {
  it("returns empty string for null and undefined", () => {
    expect(escapeCsv(null)).toBe("");
    expect(escapeCsv(undefined)).toBe("");
  });

  it("does not quote plain text", () => {
    expect(escapeCsv("hello")).toBe("hello");
  });

  it("wraps values containing commas in quotes", () => {
    expect(escapeCsv("a, b")).toBe('"a, b"');
  });

  it("escapes embedded double quotes by doubling them", () => {
    expect(escapeCsv('he said "hi"')).toBe('"he said ""hi"""');
  });

  it("neutralizes spreadsheet formulas", () => {
    expect(escapeCsv("=cmd|calc")).toBe("'=cmd|calc");
    expect(escapeCsv("+SUM(A1:A2)")).toBe("'+SUM(A1:A2)");
    expect(escapeCsv("-10")).toBe("'-10");
    expect(escapeCsv("@user")).toBe("'@user");
  });

  it("wraps values containing newlines", () => {
    expect(escapeCsv("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("rowsToCsv", () => {
  it("emits header on first line and CRLF separators", () => {
    const csv = rowsToCsv([sample]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Fecha");
    expect(lines[0]).toContain("Paciente");
  });

  it("renders null as empty trailing cell", () => {
    const csv = rowsToCsv([sample]);
    expect(csv.split("\r\n")[1].endsWith(",")).toBe(true);
  });

  it("returns just the header for an empty list", () => {
    const csv = rowsToCsv([]);
    expect(csv.split("\r\n")).toHaveLength(1);
  });
});
