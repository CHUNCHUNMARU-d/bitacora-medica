import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Cirugia } from "@/lib/types";
import { CIRUGIA_COLUMNS, rowsToCsv } from "@/lib/csv";

export { rowsToCsv } from "@/lib/csv";

export function rowsToPdfBytes(
  rows: Cirugia[],
  title: string,
  subtitle?: string,
): Uint8Array {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 14);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(subtitle, 14, 20);
    doc.setTextColor(0);
  }
  autoTable(doc, {
    startY: subtitle ? 24 : 18,
    head: [CIRUGIA_COLUMNS.map((c) => c.label)],
    body: rows.map((r) =>
      CIRUGIA_COLUMNS.map((c) => String(r[c.key] ?? "")),
    ),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40] },
  });
  return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
}

export async function saveCsv(
  rows: Cirugia[],
  defaultName: string,
): Promise<string | null> {
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path) return null;
  await invoke("write_text_file", { path, content: rowsToCsv(rows) });
  return path;
}

export async function savePdf(
  rows: Cirugia[],
  title: string,
  defaultName: string,
  subtitle?: string,
): Promise<string | null> {
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (!path) return null;
  const bytes = rowsToPdfBytes(rows, title, subtitle);
  await invoke("write_binary_file", {
    path,
    bytes: Array.from(new Uint8Array(bytes)),
  });
  return path;
}

export async function pickDirectory(): Promise<string | null> {
  const result = await open({ directory: true, multiple: false });
  return typeof result === "string" ? result : null;
}

export async function backupDb(dir: string): Promise<{ db: string; salt: string }> {
  return invoke("db_backup_to", { dir });
}
