import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/render";
import { UserActions } from "./UserActions";
import type { User } from "../types/user.types";

const user: User = {
  _id: "user-1",
  name: "Asha Sharma",
  email: "asha@example.com",
  role: "pharmacist",
  isActive: true,
  emailVerified: true,
  provider: "local",
  lastLogin: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderActions(isSelf: boolean) {
  return renderWithProviders(
    <UserActions
      user={user}
      isSelf={isSelf}
      onEdit={vi.fn()}
      onChangeRole={vi.fn()}
      onResetPassword={vi.fn()}
      onForceLogout={vi.fn()}
      onToggleActive={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
}

describe("UserActions", () => {
  it("shows owner actions for another user", async () => {
    const actor = userEvent.setup();
    renderActions(false);

    await actor.click(
      screen.getByRole("button", { name: "Actions for Asha Sharma" }),
    );

    expect(screen.getByText("Edit profile")).toBeInTheDocument();
    expect(screen.getByText("Change role")).toBeInTheDocument();
    expect(screen.getByText("Delete user")).toBeInTheDocument();
  });

  it("hides destructive actions for the signed-in user", async () => {
    const actor = userEvent.setup();
    renderActions(true);

    await actor.click(
      screen.getByRole("button", { name: "Actions for Asha Sharma" }),
    );

    expect(screen.getByText("Edit profile")).toBeInTheDocument();
    expect(screen.queryByText("Change role")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete user")).not.toBeInTheDocument();
  });
});
