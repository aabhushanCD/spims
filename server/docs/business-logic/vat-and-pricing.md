# VAT and Pricing

## 1. Verdict

| Rule | Status |
|---|---|
| 13% VAT on sales | **Implemented** |
| VAT on purchases | **Implemented** (percentage applied to taxable subtotal) |
| VAT refund on returns | **Implemented** (line VAT persisted) |
| Tax-inclusive pricing | **Not Implemented** |
| Configurable VAT rate | **Implemented** via `VAT_PERCENT`; snapshotted on sales/returns |
| Rounding to 2 decimals | **Implemented** (line and header monetary values) |

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
| Line discount | `items[].discountPercentage` (0–100) | Per medicine line | Before invoice discount |
| Invoice discount | `discount` (absolute) | Whole sale | After line discounts |

Rules:

- Duplicate medicine lines are merged; the **maximum** `discountPercentage` is kept.
- Line discount percentages are capped at 100.
- Invoice discount must be ≥ 0 and ≤ `subtotal - lineDiscounts`; a larger value returns `400`.
- A sale-item correction recomputes the line and parent totals; the invoice
  discount is derived from the stored sale total and preserved.
- No coupon, promotion, or customer-tier discount models exist.

## 5. Rounding

All persisted monetary values are rounded to two decimals through
`shared/finance/money.ts`:

```ts
roundCurrency(value)   // Math.round(|value| * 100) / 100, sign preserved
calculateVat(net, rate) // defaults to getVatRate() from VAT_PERCENT
```

Sales store `vatRate` at creation, returns store the sale's rate, and sale-item
corrections/refunds reuse the stored rate. Changing `VAT_PERCENT` never rewrites
historical documents.

- Line totals, line discounts, `subtotal`, `totalAmount`, refunds, and purchase
  totals are rounded.
- VAT is calculated once on the rounded taxable amount.
- JavaScript `Number` (binary floating point) is used; there is no Decimal128 or
  integer-minor-units representation.
- No rounding mode configuration; `Math.round` rounds half away from zero.

## 6. VAT on purchases

`PurchaseOrder`:

- `VAT` defaults to `13` and is stored as a **percentage** (0–100).
- `discount` defaults to `0` and is an absolute amount.
- `subtotal = Σ(quantity × purchasePrice)`.
- `taxable = subtotal − discount`; a discount larger than the subtotal returns `400`.
- `vatAmount = round(taxable × VAT% / 100)`.
- `totalAmount = taxable + vatAmount` and is persisted.
- `PATCH /purchases/:id/recalculate` and item add/update/remove persist the
  recalculated total.

## 7. Returns and refunds

Source: `server/src/modules/sales/services/return.service.ts`

```text
gross               = salesItem.unitPrice × returnQty
lineDiscountShare   = salesItem.discount / salesItem.quantity × returnQty
netBeforeInvoice    = gross − lineDiscountShare
invoiceDiscount     = sale.discount − Σ(all sale-item discounts)
invoiceShare        = invoiceDiscount × netBeforeInvoice / Σ(all line net values)
totalDiscountShare  = lineDiscountShare + invoiceShare
net                 = gross − totalDiscountShare
VAT                 = round(net × 0.13, 2)
refundAmount        = net + VAT
```

- The refund includes VAT.
- `returnItems[].VAT` stores the line VAT amount and is required.
- Returns are created as `PENDING`; stock/refund are applied only on
  `COMPLETED`.
- The return document stores `refundAmount` at both line and header level.
- The return does not create any payment/refund transaction.
- Invoice-level discounts are apportioned to returned lines, so refunds cannot
  exceed the net amount paid.

Example: an item sold at 100 with a 5% line discount (5 per unit), VAT 13%,
returning one unit.

```text
Original customer paid: 100 − 5 = 95 net + 12.35 VAT = 107.35
Refund computed:        95 net + 12.35 VAT = 107.35
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
| Net revenue | `(gross sales − sales VAT) − (refunds − refund VAT)` | Current reporting month |
| COGS | `Σ max(quantity − GOOD-returned, 0) × cost` | Cost = `SalesItem.purchasePrice` snapshot (batch fallback for legacy items) |
| Gross profit | `netRevenue − COGS` | Monthly |
| Margin % | `grossProfit / netRevenue × 100`, one decimal | 0 when net revenue ≤ 0 |
| Inventory value | `Σ(quantityRemaining × sellingPrice)` | Retail value, not cost; includes expired batches |
| Top-selling revenue | `Σ totalPrice × (quantity − returnedQuantity) / quantity` | VAT-exclusive, net of returns |

## 11. Edge cases

| Case | Outcome |
|---|---|
| `discountPercentage = 100` | Line total 0; VAT 0 |
| `discountPercentage > 100` | Rejected by the schema |
| Invoice discount > `subtotal − lineDiscounts` | 400 |
| Zero-priced batch | Allowed (`min: 0`); zero-value sale line |
| Selling price below purchase price | Allowed for direct batch creation; receiving enforces `sellingPrice >= purchasePrice` |
| Return of fully discounted item | Refund 0 |
| Multiple returns | Each refund uses the original per-unit + apportioned invoice discount and includes VAT |
| Sale-item correction after a return | 409 |
| Written-off return | Revenue refunded; stock/cost not restored |
| Rounding | All persisted monetary values rounded to two decimals |

## 12. What is missing

- VAT rate configuration or effective-dated tax rules.
- VAT-inclusive pricing support.
- Tax exemption categories.
- Per-item VAT rates.
- VAT return/report.
- Payment ledger and reconciliation.
- Currency and minor-unit handling.
- Effective-dated VAT rates.

## Related documents

- [Sales module](../modules/sales.md)
- [Returns module](../modules/returns.md)
- [Purchases module](../modules/purchases.md)
- [Reporting](../modules/reporting.md)
