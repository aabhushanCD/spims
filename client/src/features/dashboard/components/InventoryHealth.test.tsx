import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/render";
import InventoryHealth from "./InventoryHealth";

const summary = {
  totalMedicineBatches: 12,
  lowStockCount: 0,
  outOfStockCount: 0,
};

const expiry = {
  batchesAwaitingDisposal: 0,
  unitsAwaitingDisposal: 0,
  expiringSoonCount: 0,
};

describe("InventoryHealth", () => {
  it("shows an all-clear state when there are no alerts", () => {
    renderWithProviders(
      <InventoryHealth summary={summary} expiry={expiry} />,
    );

    expect(screen.getByText("All stock healthy")).toBeInTheDocument();
    expect(screen.getByText("12 batches on hand")).toBeInTheDocument();
  });

  it("links each alert to the page that resolves it", () => {
    renderWithProviders(
      <InventoryHealth
        summary={{ ...summary, lowStockCount: 4, outOfStockCount: 2 }}
        expiry={{
          batchesAwaitingDisposal: 1,
          unitsAwaitingDisposal: 30,
          expiringSoonCount: 3,
        }}
      />,
    );

    expect(screen.getByText("Low stock")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /low stock/i }),
    ).toHaveAttribute("href", "/stock");
    expect(
      screen.getByRole("link", { name: /expiring soon/i }),
    ).toHaveAttribute("href", "/batches");
    expect(screen.getByText("30 units to dispose")).toBeInTheDocument();
  });
});
