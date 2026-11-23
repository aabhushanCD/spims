import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/render";
import ThemeToggle from "./ThemeToggle";

const auth = vi.hoisted(() => ({
  theme: "light" as "light" | "dark",
  toggleTheme: vi.fn(),
}));

vi.mock("@/features/auth/context/authContext", () => ({
  useAuth: () => ({ theme: auth.theme, toggleTheme: auth.toggleTheme }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    auth.theme = "light";
  });

  it("offers to switch to dark mode and toggles the theme", async () => {
    const actor = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    const button = screen.getByRole("button", {
      name: "Switch to dark theme",
    });

    expect(button).toHaveAttribute("aria-pressed", "false");

    await actor.click(button);

    expect(auth.toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("offers to switch back to light mode when dark is active", () => {
    auth.theme = "dark";
    renderWithProviders(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
