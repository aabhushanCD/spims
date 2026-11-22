import type { Migration } from "./types.ts";

export const backfillPurchaseReceivedQuantity: Migration = {
  id: "004-backfill-purchase-received-quantity",
  description: "Set receivedQuantity for items on already received POs",
  async up({ db, log }): Promise<void> {
    const orders = db.collection("purchaseorders");
    const items = db.collection("purchaseorderitems");

    const receivedOrders = await orders
      .find({ status: "received" }, { projection: { _id: 1 } })
      .toArray();

    let updated = 0;
    for (const order of receivedOrders) {
      const result = await items.updateMany(
        {
          purchaseOrderId: order._id,
          $or: [
            { receivedQuantity: { $exists: false } },
            { receivedQuantity: null },
          ],
        },
        [{ $set: { receivedQuantity: "$quantity" } }],
      );
      updated += result.modifiedCount;
    }

    log(`purchase receivedQuantity: updated ${updated}`);
  },
};
