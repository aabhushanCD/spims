import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { DateFormatProvider } from "@/lib/datetime/dateFormatContext";
import { NowProvider } from "@/lib/datetime/nowContext";
import { renderWithProviders } from "@/test/render";
import RelativeTime from "./RelativeTime";

const now = new Date("2026-11-23T10:00:00Z");

describe("RelativeTime", () => {
  it("renders a relative label with the exact timestamp in the title", () => {
    renderWithProviders(
      <DateFormatProvider
        timeZone="Asia/Kathmandu"
        mode="both"
        language="en"
      >
        <NowProvider now={now}>
          <RelativeTime value="2026-11-23T08:00:00Z" />
        </NowProvider>
      </DateFormatProvider>,
    );

    const time = screen.getByText("2 hours ago");

    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute(
      "title",
      expect.stringContaining("2083"),
    );
    expect(time).toHaveAttribute(
      "aria-label",
      expect.stringContaining("23 Nov 2026"),
    );
  });

  it("falls back to an absolute date after the relative window", () => {
    renderWithProviders(
      <DateFormatProvider
        timeZone="Asia/Kathmandu"
        mode="ad"
        language="en"
      >
        <NowProvider now={now}>
          <RelativeTime value="2026-10-01T10:00:00Z" />
        </NowProvider>
      </DateFormatProvider>,
    );

    expect(screen.getByText("1 Oct 2026")).toBeInTheDocument();
  });
});
