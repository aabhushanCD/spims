import { useEffect, useState } from "react";

const STORAGE_KEY = "spims-sidebar-collapsed";

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

/**
 * Desktop sidebar collapse state, persisted per browser.
 * Defaults to expanded so first-time users see navigation labels.
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const toggle = () => {
    setCollapsed((previous) => !previous);
  };

  return { collapsed, setCollapsed, toggle } as const;
}
