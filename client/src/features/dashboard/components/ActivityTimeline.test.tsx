import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/render";
import ActivityTimeline from "./ActivityTimeline";

describe("ActivityTimeline", () => {
  it("shows an empty state with a link to movements", () => {
    renderWithProviders(<ActivityTimeline activities={[]} />);

    expect(screen.getByText("No recent activity")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View movements" }),
    ).toHaveAttribute("href", "/inventory/movements");
  });

  it("renders movement details and the full-history link", () => {
    renderWithProviders(
      <ActivityTimeline
        activities={[
          {
            _id: "movement-1",
            movementType: "SALE",
            quantity: 2,
            remarks: "Invoice INV-1001",
            createdAt: "2026-02-10T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Sale Completed")).toBeInTheDocument();
    expect(screen.getByText("Invoice INV-1001")).toBeInTheDocument();
    expect(screen.getByText("Quantity: 2")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View all movements" }),
    ).toHaveAttribute("href", "/inventory/movements");
  });
});
