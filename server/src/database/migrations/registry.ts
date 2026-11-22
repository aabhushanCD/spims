import { backfillSaleItemCostSnapshot } from "./001-backfill-sale-item-cost-snapshot.ts";
import { backfillInventoryVersions } from "./002-backfill-inventory-versions.ts";
import { backfillLineVatRates } from "./003-backfill-line-vat-rates.ts";
import { backfillPurchaseReceivedQuantity } from "./004-backfill-purchase-received-quantity.ts";
import type { Migration } from "./types.ts";

/**
 * Registry order is the execution order. Append new migrations; never reorder
 * or rename an id that has already been deployed.
 */
export const MIGRATIONS: Migration[] = [
  backfillSaleItemCostSnapshot,
  backfillInventoryVersions,
  backfillLineVatRates,
  backfillPurchaseReceivedQuantity,
];
