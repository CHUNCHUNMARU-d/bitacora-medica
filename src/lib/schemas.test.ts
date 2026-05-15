import { describe, expect, it } from "vitest";
import { cirugiaSchema } from "./schemas";

const valid = {
  fecha_cirugia: "2026-05-10",
  nombre_paciente: "Juan Pérez",
  edad: 42,
  sexo: "M" as const,
  nss: "",
  diagnostico: "Fractura tibia",
  procedimiento_quirurgico: "Osteosíntesis",
  rol_cirujano: "Cirujano titular" as const,
  observaciones: "",
};

describe("cirugiaSchema", () => {
  it("accepts a valid record", () => {
    expect(cirugiaSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects fecha not in YYYY-MM-DD", () => {
    const r = cirugiaSchema.safeParse({ ...valid, fecha_cirugia: "10/05/2026" });
    expect(r.success).toBe(false);
  });

  it("rejects empty paciente", () => {
    const r = cirugiaSchema.safeParse({ ...valid, nombre_paciente: "" });
    expect(r.success).toBe(false);
  });

  it("rejects non-numeric edad", () => {
    const r = cirugiaSchema.safeParse({ ...valid, edad: "abc" });
    expect(r.success).toBe(false);
  });

  it("rejects edad out of range", () => {
    expect(cirugiaSchema.safeParse({ ...valid, edad: 0 }).success).toBe(false);
    expect(cirugiaSchema.safeParse({ ...valid, edad: 200 }).success).toBe(false);
  });

  it("rejects sexo other than M or F", () => {
    const r = cirugiaSchema.safeParse({ ...valid, sexo: "X" });
    expect(r.success).toBe(false);
  });

  it("rejects unknown rol_cirujano", () => {
    const r = cirugiaSchema.safeParse({
      ...valid,
      rol_cirujano: "Anestesiólogo",
    });
    expect(r.success).toBe(false);
  });
});
