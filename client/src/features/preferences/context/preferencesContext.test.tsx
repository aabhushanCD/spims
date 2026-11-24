import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/render";
import { i18n } from "@/lib/i18n";
import {
  PreferencesProvider,
  usePreferences,
} from "./preferencesContext";

const mocks = vi.hoisted(() => ({
  currentUser: {
    _id: "user-1",
    name: "Asha Sharma",
    email: "asha@example.com",
    role: "pharmacist" as const,
    isActive: true,
    preferences: { language: "ne" as const, calendarMode: "both" as const },
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

function Probe() {
  const {
    language,
    calendarMode,
    timeZone,
    setLanguage,
    setCalendarMode,
  } = usePreferences();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="calendar">{calendarMode}</span>
      <span data-testid="timezone">{timeZone}</span>
      <button type="button" onClick={() => setLanguage("en")}>
        set-english
      </button>
      <button type="button" onClick={() => setCalendarMode("ad")}>
        set-ad
      </button>
    </div>
  );
}

function renderProvider() {
  return renderWithProviders(
    <PreferencesProvider>
      <Probe />
    </PreferencesProvider>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
  window.localStorage.removeItem("spims-language");
});

describe("PreferencesProvider", () => {
  it("applies the server language and workspace timezone", async () => {
    renderProvider();

    expect(screen.getByTestId("language")).toHaveTextContent("ne");
    expect(screen.getByTestId("calendar")).toHaveTextContent("both");
    expect(screen.getByTestId("timezone")).toHaveTextContent(
      "Asia/Kathmandu",
    );

    await vi.waitFor(() => {
      expect(i18n.language).toBe("ne");
    });
  });

  it("updates optimistically and patches the server", async () => {
    const actor = userEvent.setup();
    renderProvider();

    await actor.click(
      screen.getByRole("button", { name: "set-english" }),
    );

    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(mocks.mutate).toHaveBeenCalledWith(
      { language: "en" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );

    await actor.click(screen.getByRole("button", { name: "set-ad" }));

    expect(screen.getByTestId("calendar")).toHaveTextContent("ad");
    expect(mocks.mutate).toHaveBeenCalledWith(
      { calendarMode: "ad" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });
});
