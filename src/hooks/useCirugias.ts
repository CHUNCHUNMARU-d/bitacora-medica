import { useCallback, useEffect, useState } from "react";
import {
  getCirugiaById,
  insertCirugia,
  listCirugias,
  listCirugiasByPaciente,
  listProcedimientos,
  removeCirugia,
  saveCirugia,
} from "@/lib/db";
import type { Cirugia, CirugiaInput } from "@/lib/types";

export type SortMode =
  | "fecha_desc"
  | "fecha_asc"
  | "paciente_asc"
  | "paciente_desc";

export interface QueryParams {
  search: string;
  procedimiento: string | null;
  desde: string | null;
  hasta: string | null;
  sort: SortMode;
}

export function useCirugiasQuery(params: QueryParams) {
  const { search, procedimiento, desde, hasta, sort } = params;
  const [rows, setRows] = useState<Cirugia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listCirugias({
        search,
        procedimiento,
        desde,
        hasta,
        sort,
      });
      setRows(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [search, procedimiento, desde, hasta, sort]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rows, loading, error, reload };
}

export function useProcedimientos() {
  const [values, setValues] = useState<string[]>([]);

  const reload = useCallback(async () => {
    try {
      setValues(await listProcedimientos());
    } catch {
      setValues([]);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { values, reload };
}

export async function getCirugia(id: number): Promise<Cirugia | null> {
  return getCirugiaById(id);
}

export async function getCirugiasByPaciente(
  nombre: string,
): Promise<Cirugia[]> {
  return listCirugiasByPaciente(nombre);
}

export async function createCirugia(input: CirugiaInput): Promise<number> {
  return insertCirugia(input);
}

export async function updateCirugia(
  id: number,
  input: CirugiaInput,
): Promise<void> {
  await saveCirugia(id, input);
}

export async function deleteCirugia(id: number): Promise<void> {
  await removeCirugia(id);
}
