/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const NowContext = createContext<Date>(new Date());

interface NowProviderProps {
  children: ReactNode;
  /** Fixed clock for tests and deterministic stories. */
  now?: Date;
  intervalMs?: number;
}

/**
 * One clock for every relative timestamp. A per-row timer would wake the tab
 * dozens of times a minute, so the whole app shares this provider.
 */
export function NowProvider({
  children,
  now,
  intervalMs = 60_000,
}: NowProviderProps) {
  const [current, setCurrent] = useState<Date>(() => now ?? new Date());

  useEffect(() => {
    if (now) {
      return;
    }

    const tick = () => setCurrent(new Date());
    const interval = window.setInterval(tick, intervalMs);

    const refreshWhenVisible = () => {
      if (!document.hidden) {
        tick();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [now, intervalMs]);

  return (
    <NowContext.Provider value={now ?? current}>
      {children}
    </NowContext.Provider>
  );
}

export function useNow(): Date {
  return useContext(NowContext);
}
