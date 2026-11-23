import { describe, expect, it } from "vitest";
import { DollarSign } from "lucide-react";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/render";
import type { DashboardStat } from "../types/dashboard";
import StatsCard from "./StatsCard";

const baseStat: DashboardStat = {
  title: "Sales this month",
  value: 1234.5,
  prefix: "Rs. ",
  icon: DollarSign,
  iconClassName: "bg-emerald-100 text-emerald-700",
};

describe("StatsCard", () => {
  it("hides the trend badge when there is no comparison", () => {
    renderWithProviders(
      <StatsCard
        stat={{ ...baseStat, change: null, hint: "No prior month to compare" }}
      />,
    );

    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.getByText("No prior month to compare")).toBeInTheDocument();
  });

  it("renders a real delta and the compact value with a full accessible label", () => {
    renderWithProviders(<StatsCard stat={{ ...baseStat, change: 12.5 }} />);

    expect(screen.getByText("12.5%")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Sales this month: Rs. 1,234.50"),
    ).toBeInTheDocument();
    expect(screen.getByTitle("Rs. 1,234.50")).toBeInTheDocument();
  });

  it("shows a zero delta when the periods match", () => {
    renderWithProviders(<StatsCard stat={{ ...baseStat, change: 0 }} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("links the whole card when a destination is provided", () => {
    renderWithProviders(
      <StatsCard stat={{ ...baseStat, href: "/sales" }} />,
    );

    expect(
      screen.getByRole("link", { name: /sales this month/i }),
    ).toHaveAttribute("href", "/sales");
  });
});
