import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/render";
import type { ReorderRecommendation } from "../types/smart.types";
import { ReorderRecommendationCard } from "./ReorderRecommendationCard";

function recommendation(
  id: string,
  name: string,
  confidence = 85,
): ReorderRecommendation {
  return {
    _id: id,
    medicineId: { _id: `medicine-${id}`, medicineName: name, strength: "500mg" },
    currentStock: 4,
    reorderPoint: 20,
    suggestedQuantity: 30,
    safetyStock: 5,
    confidenceScore: confidence,
    recommendationReason: "Below reorder point",
    status: "PENDING",
    generatedAt: "2026-02-10T10:00:00.000Z",
  };
}

const summary = {
  pendingCount: 6,
  highConfidenceCount: 2,
  totalSuggestedUnits: 120,
};

describe("ReorderRecommendationCard", () => {
  it("shows a loading skeleton", () => {
    renderWithProviders(
      <ReorderRecommendationCard
        recommendations={[]}
        summary={summary}
        isLoading
      />,
    );

    expect(
      screen.getByLabelText("Loading reorder recommendations"),
    ).toBeInTheDocument();
  });

  it("shows a retry when loading fails", async () => {
    const actor = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(
      <ReorderRecommendationCard
        recommendations={[]}
        summary={summary}
        isError
        onRetry={onRetry}
      />,
    );

    await actor.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state with a settings link", () => {
    renderWithProviders(
      <ReorderRecommendationCard recommendations={[]} summary={summary} />,
    );

    expect(
      screen.getByText("No reorder recommendations"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /review reorder settings/i }),
    ).toHaveAttribute("href", "/smart-reorders");
  });

  it("lists the first five items and links to the full queue", () => {
    const recommendations = [
      recommendation("1", "Paracetamol"),
      recommendation("2", "Amoxicillin"),
      recommendation("3", "Metformin"),
      recommendation("4", "Vitamin C"),
      recommendation("5", "Azithromycin"),
      recommendation("6", "Omeprazole"),
    ];

    renderWithProviders(
      <ReorderRecommendationCard
        recommendations={recommendations}
        summary={summary}
      />,
    );

    expect(screen.getByText("Paracetamol")).toBeInTheDocument();
    expect(screen.getByText("Azithromycin")).toBeInTheDocument();
    expect(screen.queryByText("Omeprazole")).not.toBeInTheDocument();
    expect(screen.getByText("+1 more pending")).toBeInTheDocument();

    expect(
      screen.getByText(
        "6 pending · 2 high confidence · 120 units suggested",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /view all recommendations/i }),
    ).toHaveAttribute("href", "/smart-reorders");
  });
});
