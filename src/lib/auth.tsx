import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { dbLock, dbSetup, dbStatus, dbUnlock, type DbStatus } from "@/lib/db";

interface AuthValue {
  status: DbStatus | "loading";
  setup: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DbStatus | "loading">("loading");

  const refresh = useCallback(async () => {
    setStatus(await dbStatus());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setup = useCallback(
    async (password: string) => {
      await dbSetup(password);
      await refresh();
    },
    [refresh],
  );

  const unlock = useCallback(
    async (password: string) => {
      await dbUnlock(password);
      await refresh();
    },
    [refresh],
  );

  const lock = useCallback(async () => {
    await dbLock();
    await refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ status, setup, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
