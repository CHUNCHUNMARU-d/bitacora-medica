import { useCallback, useEffect, useState } from "react";
import type { RadiografiaMeta } from "@/lib/types";
import {
  deleteRadiografia,
  listRadiografias,
  updateRadiografiaCaption,
  uploadRadiografia,
} from "@/lib/radiografias";

export function useRadiografias(cirugiaId: number | null) {
  const [items, setItems] = useState<RadiografiaMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (cirugiaId == null) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setItems(await listRadiografias(cirugiaId));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [cirugiaId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const upload = useCallback(
    async (sourcePath: string, caption: string | null) => {
      if (cirugiaId == null) throw new Error("Cirugía requerida");
      const id = await uploadRadiografia(cirugiaId, sourcePath, caption);
      await reload();
      return id;
    },
    [cirugiaId, reload],
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteRadiografia(id);
      await reload();
    },
    [reload],
  );

  const setCaption = useCallback(
    async (id: number, caption: string | null) => {
      await updateRadiografiaCaption(id, caption);
      await reload();
    },
    [reload],
  );

  return { items, loading, error, reload, upload, remove, setCaption };
}
