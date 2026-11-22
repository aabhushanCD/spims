import type { Migration } from "./types.ts";

/**
 * Copies the header VAT rate into sale items, return items, and purchase items
 * that predate line-level snapshots. Missing headers fall back to 13%.
 */
export const backfillLineVatRates: Migration = {
  id: "003-backfill-line-vat-rates",
  description: "Copy header VAT rate into sale/return/purchase lines",
  async up({ db, log }): Promise<void> {
    const sales = db.collection("sales");
    const saleItems = db.collection("salesitems");
    const returns = db.collection("returns");
    const purchaseOrders = db.collection("purchaseorders");
    const purchaseItems = db.collection("purchaseorderitems");

    let saleUpdated = 0;
    const saleCursor = saleItems.find({
      $or: [{ vatRate: { $exists: false } }, { vatRate: null }],
    });
    for await (const item of saleCursor) {
      const sale = await sales.findOne(
        { _id: item.salesId },
        { projection: { vatRate: 1 } },
      );
      const vatRate =
        typeof sale?.vatRate === "number" ? sale.vatRate : 13;
      await saleItems.updateOne(
        { _id: item._id },
        { $set: { vatRate } },
      );
      saleUpdated += 1;
    }

    let returnUpdated = 0;
    const returnCursor = returns.find({
      "returnItems.vatRate": { $exists: false },
    });
    for await (const doc of returnCursor) {
      const vatRate =
        typeof doc.vatRate === "number" ? doc.vatRate : 13;
      const items = Array.isArray(doc.returnItems) ? doc.returnItems : [];
      await returns.updateOne(
        { _id: doc._id },
        {
          $set: {
            returnItems: items.map((item: Record<string, unknown>) => ({
              ...item,
              vatRate,
            })),
          },
        },
      );
      returnUpdated += 1;
    }

    let purchaseUpdated = 0;
    const purchaseCursor = purchaseItems.find({
      $or: [{ vatRate: { $exists: false } }, { vatRate: null }],
    });
    for await (const item of purchaseCursor) {
      const order = await purchaseOrders.findOne(
        { _id: item.purchaseOrderId },
        { projection: { VAT: 1 } },
      );
      const vatRate =
        typeof order?.VAT === "number" ? order.VAT : 13;
      await purchaseItems.updateOne(
        { _id: item._id },
        { $set: { vatRate } },
      );
      purchaseUpdated += 1;
    }

    log(
      `line VAT rates: sales ${saleUpdated}, returns ${returnUpdated}, purchases ${purchaseUpdated}`,
    );
  },
};
