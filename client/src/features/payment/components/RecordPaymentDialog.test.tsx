import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/render";
import RecordPaymentDialog from "./RecordPaymentDialog";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("../hooks/useSalePayments", () => ({
  useAddSalePayment: () => ({ mutate, isPending: false }),
}));

describe("RecordPaymentDialog", () => {
  it("submits the full outstanding amount by default", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <RecordPaymentDialog
        saleId="sale-1"
        amountDue={100}
        onOpenChange={onOpenChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Record payment" }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100,
        method: "CASH",
        idempotencyKey: expect.any(String),
      }),
      expect.anything(),
    );
  });

  it("blocks overpayment before calling the API", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RecordPaymentDialog
        saleId="sale-1"
        amountDue={100}
        onOpenChange={() => undefined}
      />,
    );

    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "101");
    await user.click(screen.getByRole("button", { name: "Record payment" }));

    expect(screen.getByText(/cannot exceed/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });
});
