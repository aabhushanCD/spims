import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/render";
import TopSellingCard from "./TopSellingCard";

describe("TopSellingCard", () => {
  it("shows an empty state when nothing has sold", () => {
    renderWithProviders(<TopSellingCard topSelling={[]} />);

    expect(screen.getByText("No sales recorded yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create a sale" }),
    ).toHaveAttribute("href", "/sales");
  });

  it("lists ranked medicines with units and revenue", () => {
    renderWithProviders(
      <TopSellingCard
        topSelling={[
          {
            medicineId: "medicine-1",
            medicineName: "Paracetamol",
            strength: "500mg",
            totalQuantitySold: 120,
            totalRevenue: 12500,
          },
          {
            medicineId: "medicine-2",
            medicineName: "Amoxicillin",
            strength: "250mg",
            totalQuantitySold: 80,
            totalRevenue: 9000,
          },
        ]}
      />,
    );

    expect(screen.getByText("Paracetamol")).toBeInTheDocument();
    expect(screen.getByText("500mg · 120 sold")).toBeInTheDocument();
    expect(screen.getByTitle("Rs. 12,500.00")).toHaveTextContent("Rs. 12.5K");
    expect(
      screen.getByRole("link", { name: "Open reports" }),
    ).toHaveAttribute("href", "/reports");
  });
});
