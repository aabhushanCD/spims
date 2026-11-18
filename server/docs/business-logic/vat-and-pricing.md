# VAT and Pricing

## 1. Verdict

| Rule | Status |
|---|---|
| 13% VAT on sales | **Implemented** |
| VAT on purchases | **Stored only, not calculated** |
| VAT refund on returns | **Not Implemented** |
| Tax-inclusive pricing | **Not Implemented** |
| Configurable VAT rate | **Not Implemented** (hardcoded 0.13) |
| Rounding to 2 decimals | **Partially Implemented** (VAT only) |

## 2. Sales pricing pipeline

Source: `server/src/modules/sales/services/sales.service.ts`

For each batch allocation:

```text
lineTotal    = batch.sellingPrice * allocatedQuantity
lineDiscount = lineTotal * discountPercentage / 100
itemTotal    = lineTotal - lineDiscount          // stored in SalesItem.totalPrice
```

For the invoice:

```text
subtotal       = Σ lineTotal
lineDiscounts  = Σ lineDiscount
invoiceDiscount= dto.discount (absolute, default 0)
taxable        = subtotal - lineDiscounts - invoiceDiscount
VAT            = round(taxable * 0.13, 2)
totalAmount    = taxable + VAT
Sales.discount = invoiceDiscount + lineDiscounts
```

Stored fields:

| Field | Meaning |
|---|---|
| `Sales.subTotal` | Gross line value before any discount |
| `Sales.discount` | Sum of line discounts + invoice discount |
| `Sales.VAT` | Tax amount (not a percentage) |
| `Sales.totalAmount` | `taxable + VAT` |
| `SalesItem.totalPrice` | Net line value, VAT-exclusive |
| `SalesItem.discount` | Absolute line discount |

## 3. Example

Cart:

- Medicine A: 3 units, batch price 100, line discount 5%
- Medicine B: 2 units, batch price 50, line discount 0%
- Invoice discount: 25

```text
A lineTotal      = 300
A lineDiscount   = 15
A itemTotal      = 285

B lineTotal      = 100
B lineDiscount   = 0
B itemTotal      = 100

subtotal         = 400
lineDiscounts    = 15
taxable          = 400 - 15 - 25 = 360
VAT              = round(360 * 0.13, 2) = 46.8
totalAmount      = 406.8
Sales.discount   = 40
```

The sale stores `subTotal: 400`, `discount: 40`, `VAT: 46.8`, `totalAmount: 406.8`.

## 4. Discounts

| Discount | Input | Scope | Applied |
|---|---|---|---|
| Line discount | `items[].discountPercentage` (0–100 not enforced) | Per medicine line | Before invoice discount |
| Invoice discount | `discount` (absolute) | Whole sale | After line discounts |

Rules:

- Duplicate medicine lines are merged; the **maximum** `discountPercentage` is kept.
- Line discount percentages have no upper bound in Zod (`z.number().min(0)`), so a value above 100 produces a negative line total and negative taxable amount.
- Invoice discount must be ≥ 0 and ≤ `subtotal` (not ≤ taxable). It is validated after allocation.
- If line discounts already exceed the subtotal, invoice discount validation can still pass and produce a negative `taxable`, hence negative VAT.
- No coupon, promotion, or customer-tier discount models exist.

## 5. Rounding

Only VAT is rounded:

```ts
const vat = Math.round(taxable * 0.13 * 100) / 100;
```

- `subtotal`, line totals, and `totalAmount` are not rounded.
- `totalAmount = taxable + vat` can carry more than two decimals when batch prices have decimals.
- JavaScript `Number` (binary floating point) is used; there is no Decimal128 or integer-minor-units representation.
- No rounding mode configuration; `Math.round` rounds half away from zero for positive values.

Example of drift: two units at `0.1` produce `subtotal = 0.2`, but repeated additions can produce `0.30000000000000004` in longer carts.

## 6. VAT on purchases

`PurchaseOrder`:

- `VAT` defaults to `13` and is stored as a **percentage**.
- `discount` defaults to `0`.
- `totalAmount` is computed as `Σ(quantity * purchasePrice)`.
- Neither VAT nor discount is applied to `totalAmount`.
- `GET /purchases/:id` returns `VAT` and `discount` but does not compute a tax amount.

So a purchase order with `VAT: 13` does not show a VAT-inclusive total. The field is descriptive only.

## 7. Returns and refunds

Source: `server/src/modules/sales/services/return.service.ts`

```text
discountPerUnit = salesItem.discount / salesItem.quantity
refund          = salesItem.unitPrice * returnQty - discountPerUnit * returnQty
```

- The refund is VAT-exclusive.
- VAT paid on the original sale is not refunded.
- The return document stores `refundAmount` at both line and header level.
- `returnItems[].VAT` is required in the schema but never populated. Because returns are written with `findByIdAndUpdate`, the required validator is skipped.
- The return does not create any payment/refund transaction.

Example: an item sold at 100 with a 5% line discount (5 per unit), VAT 13%.

```text
Original customer paid: 100 - 5 = 95 net + 12.35 VAT = 107.35
Refund computed:        100 - 5 = 95
Difference:             12.35 not refunded
```

## 8. Payment handling

| Aspect | Implementation |
|---|---|
| Payment method | String field; Zod restricts creation to `CASH`, `CARD`, `QR`, `Mobile Banking`, `CREDIT` |
| Payment status | None |
| Amount paid / change | None |
| Gateway integration | None (eSewa/Khalti/Stripe are not present) |
| Refund transaction | None |
| Credit tracking | None; `CREDIT` is just a label |

## 9. Pricing sources

| Price | Source |
|---|---|
| Selling price | `Batch.sellingPrice` at allocation time |
| Purchase price | `PurchaseOrderItem.purchasePrice`, copied to `Batch.purchasePrice` on receipt |
| Client-supplied price | Ignored on sales |
| Price history | Not modeled; changing a batch price does not affect past sale items |
| Medicine-level price | Not stored on `Medicine` |

## 10. Financial calculations elsewhere

| Metric | Formula | Caveat |
|---|---|---|
| Gross profit | `totalSales - totalPurchases` (current month) | Not COGS; VAT-inclusive sales vs VAT-exclusive purchases |
| Margin % | `grossProfit / totalSales * 100`, one decimal | Same caveat |
| Inventory value | `Σ(quantityRemaining * sellingPrice)` | Retail value, not cost |
| Top-selling revenue | `Σ SalesItem.totalPrice` | VAT-exclusive, returns not deducted |

## 11. Edge cases

| Case | Outcome |
|---|---|
| `discountPercentage = 100` | Line total 0; VAT 0 |
| `discountPercentage > 100` | Negative line total; negative taxable possible |
| Invoice discount > subtotal | 400 |
| Invoice discount between taxable and subtotal | Accepted; can produce negative VAT |
| Zero-priced batch | Allowed (`min: 0`); zero-value sale line |
| Selling price below purchase price | Allowed for direct batch creation; receiving enforces `sellingPrice >= purchasePrice` |
| Return of fully discounted item | Refund 0 |
| Multiple returns | Each refund uses the original per-unit discount; total refunds converge to the item's net value minus VAT |
| Rounding | VAT rounded; other totals not |

## 12. What is missing

- VAT rate configuration or effective-dated tax rules.
- VAT-inclusive pricing support.
- Tax exemption categories.
- Per-item VAT rates.
- VAT return/report.
- Refund of VAT.
- Payment ledger and reconciliation.
- Currency and minor-unit handling.
- Rounding policy for line and invoice totals.
- Discount validation upper bound.

## Related documents

- [Sales module](../modules/sales.md)
- [Returns module](../modules/returns.md)
- [Purchases module](../modules/purchases.md)
- [Reporting](../modules/reporting.md)
