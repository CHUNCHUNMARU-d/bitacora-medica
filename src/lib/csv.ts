import type { Cirugia } from "@/lib/types";

interface Column {
  key: keyof Cirugia;
  label: string;
}

export const CIRUGIA_COLUMNS: Column[] = [
  { key: "fecha_cirugia", label: "Fecha" },
  { key: "nombre_paciente", label: "Paciente" },
  { key: "edad", label: "Edad" },
  { key: "sexo", label: "Sexo" },
  { key: "nss", label: "NSS" },
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "procedimiento_quirurgico", label: "Procedimiento" },
  { key: "rol_cirujano", label: "Rol" },
  { key: "observaciones", label: "Observaciones" },
];

export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  const s = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv(rows: Cirugia[]): string {
  const header = CIRUGIA_COLUMNS.map((c) => c.label).join(",");
  const lines = rows.map((r) =>
    CIRUGIA_COLUMNS.map((c) => escapeCsv(r[c.key])).join(","),
  );
  return [header, ...lines].join("\r\n");
}
