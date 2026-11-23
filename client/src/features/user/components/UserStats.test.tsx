import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { UserStats } from "./UserStats";

describe("UserStats", () => {
  it("renders the supplied counts", () => {
    render(<UserStats total={12} active={9} inactive={3} />);

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <UserStats total={12} active={9} inactive={3} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
