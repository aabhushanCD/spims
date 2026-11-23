import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Boxes, LayoutDashboard } from "lucide-react";

import { renderWithProviders } from "@/test/render";
import SidebarItem from "./SidebarItem";

describe("SidebarItem", () => {
  it("marks Dashboard as current only on the index route", () => {
    const { unmount } = renderWithProviders(
      <SidebarItem title="Dashboard" icon={LayoutDashboard} path="/" />,
      { route: "/stock" },
    );

    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");

    unmount();

    renderWithProviders(
      <SidebarItem title="Dashboard" icon={LayoutDashboard} path="/" />,
      { route: "/" },
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("opens the group that contains the current route", () => {
    renderWithProviders(
      <SidebarItem
        title="Inventory"
        icon={Boxes}
        children={[{ title: "Stock", path: "/stock" }]}
      />,
      { route: "/stock" },
    );

    expect(screen.getByRole("button", { name: "Inventory" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    expect(screen.getByRole("link", { name: "Stock" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("stays collapsed when no child route is active", () => {
    renderWithProviders(
      <SidebarItem
        title="Inventory"
        icon={Boxes}
        children={[{ title: "Stock", path: "/stock" }]}
      />,
      { route: "/medicines" },
    );

    expect(screen.getByRole("button", { name: "Inventory" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      screen.queryByRole("link", { name: "Stock" }),
    ).not.toBeInTheDocument();
  });

  it("toggles the group and reports navigation", async () => {
    const actor = userEvent.setup();
    const onNavigate = vi.fn();

    renderWithProviders(
      <SidebarItem
        title="Inventory"
        icon={Boxes}
        children={[{ title: "Stock", path: "/stock" }]}
        onNavigate={onNavigate}
      />,
      { route: "/stock" },
    );

    const toggle = screen.getByRole("button", { name: "Inventory" });

    await actor.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await actor.click(toggle);
    await actor.click(screen.getByRole("link", { name: "Stock" }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
