import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Store } from "@tauri-apps/plugin-store";
import { z } from "zod";

const STORE_FILE = "settings.json";
const KEY = "autoLock";

export interface AutoLockSettings {
  enabled: boolean;
  minutes: number;
}

const DEFAULT: AutoLockSettings = { enabled: false, minutes: 10 };

const autoLockSchema = z.object({
  enabled: z.boolean(),
  minutes: z.number().int().positive(),
});

interface SettingsValue {
  autoLock: AutoLockSettings;
  setAutoLock: (next: AutoLockSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [autoLock, setAutoLockState] = useState<AutoLockSettings>(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const store = await Store.load(STORE_FILE);
      const raw = await store.get<unknown>(KEY);
      const parsed = autoLockSchema.safeParse(raw);
      if (!cancelled && parsed.success) setAutoLockState(parsed.data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAutoLock = useCallback(async (next: AutoLockSettings) => {
    setAutoLockState(next);
    const store = await Store.load(STORE_FILE);
    await store.set(KEY, next);
    await store.save();
  }, []);

  return (
    <SettingsContext.Provider value={{ autoLock, setAutoLock }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
