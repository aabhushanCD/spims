import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/render";
import SidebarToggle from "./SidebarToggle";

describe("SidebarToggle", () => {
  it("offers to collapse an expanded sidebar", async () => {
    const actor = userEvent.setup();
    const onToggle = vi.fn();

    renderWithProviders(
      <SidebarToggle collapsed={false} onToggle={onToggle} />,
    );

    const button = screen.getByRole("button", { name: "Collapse sidebar" });

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("aria-controls", "app-sidebar");

    await actor.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("offers to expand a collapsed sidebar", () => {
    renderWithProviders(<SidebarToggle collapsed onToggle={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
