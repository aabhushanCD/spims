import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { DateFormatProvider } from "@/lib/datetime/dateFormatContext";
import { renderWithProviders } from "@/test/render";
import AppDate from "./AppDate";

describe("AppDate", () => {
  it("renders BS primary with the AD date alongside in Nepal", () => {
    renderWithProviders(
      <DateFormatProvider
        timeZone="Asia/Kathmandu"
        mode="both"
        language="en"
      >
        <AppDate value="2023-07-08" kind="date-only" />
      </DateFormatProvider>,
    );

    const time = screen.getByText(/2080/).closest("time");

    expect(time).toBeInTheDocument();
    expect(screen.getByText("8 Jul 2023")).toBeInTheDocument();
    expect(time).toHaveAttribute("dateTime", "2023-07-08");
    expect(time).toHaveAttribute(
      "title",
      expect.stringContaining("8 Jul 2023"),
    );
  });

  it("renders AD only when requested", () => {
    renderWithProviders(
      <DateFormatProvider
        timeZone="Asia/Kathmandu"
        mode="ad"
        language="en"
      >
        <AppDate value="2026-02-10" kind="date-only" />
      </DateFormatProvider>,
    );

    expect(screen.getByText("10 Feb 2026")).toBeInTheDocument();
    expect(screen.queryByText(/2082/)).not.toBeInTheDocument();
  });
});
