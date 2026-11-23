import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/render";
import RevenueChart from "./RevenueChart";

const zeroTrend = [
  { month: 1, total: 0, count: 0 },
  { month: 2, total: 0, count: 0 },
];

describe("RevenueChart", () => {
  it("shows an empty state when every month is zero", () => {
    renderWithProviders(<RevenueChart revenueTrend={zeroTrend} />);

    expect(screen.getByText("No sales recorded this year")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create a sale" }),
    ).toHaveAttribute("href", "/sales");
  });

  it("describes the chart for screen readers when revenue exists", () => {
    renderWithProviders(
      <RevenueChart
        revenueTrend={[
          { month: 1, total: 1200, count: 3 },
          { month: 2, total: 800, count: 2 },
        ]}
      />,
    );

    expect(
      screen.getByText(/Revenue from January to February/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No sales recorded this year"),
    ).not.toBeInTheDocument();
  });
});
