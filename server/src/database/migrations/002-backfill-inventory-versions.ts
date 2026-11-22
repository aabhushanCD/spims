import type { Migration } from "./types.ts";

export const backfillInventoryVersions: Migration = {
  id: "002-backfill-inventory-versions",
  description: "Set version=0 on inventory rows created before optimistic CAS",
  async up({ db, log }): Promise<void> {
    const result = await db
      .collection("inventories")
      .updateMany({ version: { $exists: false } }, { $set: { version: 0 } });

    log(`inventory versions: updated ${result.modifiedCount}`);
  },
};
