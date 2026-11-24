import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/render";
import { i18n } from "@/lib/i18n";
import { PreferencesProvider } from "../context/preferencesContext";
import PreferencesPage from "./PreferencesPage";

const mocks = vi.hoisted(() => ({
  currentUser: {
    _id: "user-1",
    name: "Asha Sharma",
    email: "asha@example.com",
    role: "pharmacist" as const,
    isActive: true,
    preferences: { language: "en" as const, calendarMode: "auto" as const },
  },
  mutate: vi.fn(),
}));

vi.mock("@/features/auth/context/authContext", () => ({
  useAuth: () => ({
    currentUser: mocks.currentUser,
    setCurrentUser: vi.fn(),
  }),
}));

vi.mock("@/features/config/hooks/useWorkspaceConfig", () => ({
  useWorkspaceConfig: () => ({
    data: { reportingTimeZone: "Asia/Kathmandu" },
  }),
}));

vi.mock("../hooks/useUpdatePreferences", () => ({
  useUpdatePreferences: () => ({
    mutate: mocks.mutate,
    isPending: false,
  }),
}));

function renderPage() {
  return renderWithProviders(
    <PreferencesProvider>
      <PreferencesPage />
    </PreferencesProvider>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
  window.localStorage.removeItem("spims-language");
});

describe("PreferencesPage", () => {
  it("shows the current language, calendar, and workspace timezone", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Preferences" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Asia/Kathmandu")).toBeInTheDocument();
    expect(screen.getByTestId("preference-language")).toHaveValue("en");
    expect(screen.getByTestId("preference-calendar")).toHaveValue("auto");
  });

  it("saves language and calendar changes", async () => {
    const actor = userEvent.setup();
    renderPage();

    await actor.selectOptions(
      screen.getByTestId("preference-language"),
      "ne",
    );

    expect(screen.getByTestId("preference-language")).toHaveValue("ne");
    expect(mocks.mutate).toHaveBeenCalledWith(
      { language: "ne" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );

    await actor.selectOptions(
      screen.getByTestId("preference-calendar"),
      "bs",
    );

    expect(screen.getByTestId("preference-calendar")).toHaveValue("bs");
    expect(mocks.mutate).toHaveBeenCalledWith(
      { calendarMode: "bs" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });
});
