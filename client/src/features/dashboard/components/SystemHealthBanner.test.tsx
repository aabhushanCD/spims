import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/render";
import SystemHealthBanner from "./SystemHealthBanner";

const auth = vi.hoisted(() => ({
  role: "owner" as "owner" | "inventory_manager" | "pharmacist",
}));

vi.mock("@/features/auth/context/authContext", () => ({
  useAuth: () => ({
    currentUser: {
      _id: "user-1",
      name: "Asha Sharma",
      email: "asha@example.com",
      role: auth.role,
      isActive: true,
    },
  }),
}));

describe("SystemHealthBanner", () => {
  it("renders nothing when there are no stale jobs", () => {
    const { container } = renderWithProviders(
      <SystemHealthBanner systemHealth={{ staleJobCount: 0, staleJobs: [] }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("lists stale jobs and links owners to the audit log", () => {
    renderWithProviders(
      <SystemHealthBanner
        systemHealth={{
          staleJobCount: 2,
          staleJobs: [
            {
              jobName: "expiry-check",
              startedAt: "2026-02-10T10:00:00.000Z",
              status: "IN_PROGRESS",
            },
            {
              jobName: "reorder-calculation",
              startedAt: "2026-02-10T09:00:00.000Z",
              status: "FAILED",
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "2 background jobs need attention",
    );
    expect(screen.getByText(/expiry-check/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View audit log" }),
    ).toHaveAttribute("href", "/audit");
  });
});
