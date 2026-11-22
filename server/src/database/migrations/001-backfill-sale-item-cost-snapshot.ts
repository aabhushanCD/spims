import type { ObjectId } from "mongodb";

import type { Migration } from "./types.ts";

interface SaleItemDocument {
  _id: ObjectId;
  batchId?: ObjectId | null;
  purchasePrice?: number | null;
}

interface BatchDocument {
  purchasePrice?: number | null;
}

/**
 * Pre-Phase-4 sale items have no cost snapshot. When the original batch still
 * exists, copy its purchase price so COGS and profit no longer fall back to the
 * current batch price. Items whose batch is gone are left untouched.
 */
export const backfillSaleItemCostSnapshot: Migration = {
  id: "001-backfill-sale-item-cost-snapshot",
  description:
    "Copy batch purchasePrice into sale items that lack a cost snapshot",
  async up({ db, log }): Promise<void> {
    const saleItems = db.collection<SaleItemDocument>("salesitems");
    const batches = db.collection<BatchDocument>("batches");

    const cursor = saleItems.find({
      $or: [
        { purchasePrice: { $exists: false } },
        { purchasePrice: null },
      ],
    });

    let updated = 0;
    let skipped = 0;

    for await (const item of cursor) {
      if (!item.batchId) {
        skipped += 1;
        continue;
      }

      const batch = await batches.findOne(
        { _id: item.batchId },
        { projection: { purchasePrice: 1 } },
      );

      if (!batch || typeof batch.purchasePrice !== "number") {
        skipped += 1;
        continue;
      }

      await saleItems.updateOne(
        { _id: item._id },
        { $set: { purchasePrice: batch.purchasePrice } },
      );
      updated += 1;
    }

    log(
      `sale item cost snapshot: updated ${updated}, skipped ${skipped} (no batch or price)`,
    );
  },
};
