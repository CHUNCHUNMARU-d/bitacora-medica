import { invoke } from "@tauri-apps/api/core";
import type { Cirugia, CirugiaInput } from "@/lib/types";
import type { QueryParams } from "@/hooks/useCirugias";
import type { Stats } from "@/hooks/useStats";

export type DbStatus = "fresh" | "locked" | "unlocked";

export async function dbStatus(): Promise<DbStatus> {
  return invoke<DbStatus>("db_status");
}

export async function dbSetup(password: string): Promise<void> {
  await invoke("db_setup", { password });
}

export async function dbUnlock(password: string): Promise<void> {
  await invoke("db_unlock", { password });
}

export async function dbLock(): Promise<void> {
  await invoke("db_lock");
}

export async function dbRekey(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await invoke("db_rekey", { oldPassword, newPassword });
}

export async function listCirugias(params: QueryParams): Promise<Cirugia[]> {
  return invoke<Cirugia[]>("cirugias_list", { params });
}

export async function listProcedimientos(): Promise<string[]> {
  return invoke<string[]>("procedimientos_list");
}

export async function getCirugiaById(id: number): Promise<Cirugia | null> {
  return invoke<Cirugia | null>("cirugia_get", { id });
}

export async function listCirugiasByPaciente(
  nombre: string,
): Promise<Cirugia[]> {
  return invoke<Cirugia[]>("cirugias_by_paciente", { nombre });
}

export async function insertCirugia(input: CirugiaInput): Promise<number> {
  return invoke<number>("cirugia_create", { input });
}

export async function saveCirugia(
  id: number,
  input: CirugiaInput,
): Promise<void> {
  await invoke("cirugia_update", { id, input });
}

export async function removeCirugia(id: number): Promise<void> {
  await invoke("cirugia_delete", { id });
}

export async function getStats(params: {
  currentYm: string;
  months: string[];
}): Promise<Stats> {
  return invoke<Stats>("stats_get", { params });
}
