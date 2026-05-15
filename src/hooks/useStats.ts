import { useCallback, useEffect, useState } from "react";
import { getStats } from "@/lib/db";
import { currentYearMonth, lastTwelveMonths } from "@/lib/dates";

export interface MonthBucket {
  ym: string;
  count: number;
}

export interface ProcedimientoBucket {
  procedimiento: string;
  count: number;
}

export interface Stats {
  total: number;
  esteMes: number;
  topProcedimiento: string | null;
  porMes: MonthBucket[];
  topProcedimientos: ProcedimientoBucket[];
}

const EMPTY: Stats = {
  total: 0,
  esteMes: 0,
  topProcedimiento: null,
  porMes: [],
  topProcedimientos: [],
};

export function useStats(refreshKey: number = 0) {
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const ym = currentYearMonth();
      const months = lastTwelveMonths();
      setStats(await getStats({ currentYm: ym, months }));
    } catch {
      setStats(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  return { stats, loading, reload };
}
