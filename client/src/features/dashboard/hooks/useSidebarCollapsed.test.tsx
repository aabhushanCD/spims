import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useSidebarCollapsed } from "./useSidebarCollapsed";

const STORAGE_KEY = "spims-sidebar-collapsed";

describe("useSidebarCollapsed", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to expanded", () => {
    const { result } = renderHook(() => useSidebarCollapsed());

    expect(result.current.collapsed).toBe(false);
  });

  it("reads the stored state", () => {
    window.localStorage.setItem(STORAGE_KEY, "true");

    const { result } = renderHook(() => useSidebarCollapsed());

    expect(result.current.collapsed).toBe(true);
  });

  it("toggles and persists the state", () => {
    const { result } = renderHook(() => useSidebarCollapsed());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.collapsed).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

    act(() => {
      result.current.toggle();
    });

    expect(result.current.collapsed).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
  });
});
