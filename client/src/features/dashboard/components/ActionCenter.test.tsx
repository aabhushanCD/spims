import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/render";
import ActionCenter from "./ActionCenter";

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

const emptyCounts = {
  summary: { lowStockCount: 0, outOfStockCount: 0 },
  expiry: { expiringSoonCount: 0, batchesAwaitingDisposal: 0 },
  reorder: { pendingCount: 0 },
  notifications: { failedDeliveries: 0 },
};

describe("ActionCenter", () => {
  it("shows an all-clear state when nothing needs attention", () => {
    renderWithProviders(<ActionCenter {...emptyCounts} />);

    expect(screen.getByText("No urgent actions")).toBeInTheDocument();
  });

  it("links aggregate counts to their pages", () => {
    renderWithProviders(
      <ActionCenter
        {...emptyCounts}
        summary={{ lowStockCount: 3, outOfStockCount: 2 }}
        expiry={{ expiringSoonCount: 4, batchesAwaitingDisposal: 1 }}
        reorder={{ pendingCount: 6 }}
        notifications={{ failedDeliveries: 2 }}
      />,
    );

    expect(screen.getByText("3 low · 2 out")).toBeInTheDocument();
    expect(screen.getByText("4 expiring · 1 disposal")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /stock alerts/i }),
    ).toHaveAttribute("href", "/stock");
    expect(
      screen.getByRole("link", { name: /expiry queue/i }),
    ).toHaveAttribute("href", "/batches");
    expect(
      screen.getByRole("link", { name: /reorders pending/i }),
    ).toHaveAttribute("href", "/smart-reorders");
    expect(
      screen.getByRole("link", { name: /notification failures/i }),
    ).toHaveAttribute("href", "/notifications/admin");
  });
});
