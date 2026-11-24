import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DateFormatProvider } from "@/lib/datetime/dateFormatContext";
import {
  formatDateParts,
  formatWeekday,
} from "@/lib/datetime/workspaceDate";
import { renderWithProviders } from "@/test/render";
import Topbar from "./Topbar";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  toggleTheme: vi.fn(),
  user: {
    _id: "user-1",
    name: "Asha Sharma",
    email: "asha@example.com",
    role: "inventory_manager" as const,
    isActive: true,
  },
}));

vi.mock("@/features/auth/context/authContext", () => ({
  useAuth: () => ({
    currentUser: mocks.user,
    theme: "light",
    toggleTheme: mocks.toggleTheme,
  }),
}));

vi.mock("@/features/auth/hooks/useLogout", () => ({
  useLogout: () => ({ mutate: mocks.logout, isPending: false }),
}));

vi.mock("@/features/notification/components/NotificationDropdown", () => ({
  default: () => <div data-testid="notification-dropdown" />,
}));

vi.mock("@/components/MobileSidebar", () => ({
  default: () => <div data-testid="mobile-sidebar" />,
}));

const renderTopbar = (onToggleSidebar = vi.fn()) =>
  renderWithProviders(
    <Topbar collapsed={false} onToggleSidebar={onToggleSidebar} />,
  );

describe("Topbar", () => {
  it("shows a humanized role and a working theme toggle", () => {
    renderTopbar();

    expect(screen.getByText("Inventory manager")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("shows BS primary and AD secondary dates in the workspace timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-23T10:00:00Z"));

    try {
      const now = new Date();
      const expected = formatDateParts(now, {
        timeZone: "Asia/Kathmandu",
        mode: "both",
        language: "en",
      });
      const weekday = formatWeekday(now, "Asia/Kathmandu", "en");

      renderWithProviders(
        <DateFormatProvider
          timeZone="Asia/Kathmandu"
          mode="both"
          language="en"
        >
          <Topbar collapsed={false} onToggleSidebar={vi.fn()} />
        </DateFormatProvider>,
      );

      expect(screen.getByText(weekday)).toBeInTheDocument();
      expect(screen.getByText(expected.primary)).toBeInTheDocument();
      expect(expected.secondary).toBeDefined();
      expect(
        screen.getByText(expected.secondary as string),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("exposes the desktop sidebar toggle", () => {
    const onToggleSidebar = vi.fn();
    renderTopbar(onToggleSidebar);

    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeInTheDocument();
  });

  it("exposes one profile entry and logout in the account menu", async () => {
    const actor = userEvent.setup();
    renderTopbar();

    await actor.click(screen.getByRole("button", { name: /asha sharma/i }));

    expect(screen.getByText("Profile & security")).toBeInTheDocument();
    expect(screen.queryByText("Account Settings")).not.toBeInTheDocument();

    await actor.click(screen.getByText("Logout"));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });
});
