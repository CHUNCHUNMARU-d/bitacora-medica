import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";

const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "wheel"] as const;

export function useIdleLock() {
  const { autoLock } = useSettings();
  const { lock } = useAuth();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!autoLock.enabled || autoLock.minutes <= 0) return;
    const ms = autoLock.minutes * 60_000;

    const reset = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void lock();
      }, ms);
    };

    reset();
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [autoLock.enabled, autoLock.minutes, lock]);
}
