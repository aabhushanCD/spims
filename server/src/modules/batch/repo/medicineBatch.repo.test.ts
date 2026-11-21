import { describe, expect, it, vi } from "vitest";
import { MedicineBatchRepo } from "./medicineBatch.repo.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const BATCH_ID = "507f1f77bcf86cd799439021";

function buildRepo() {
  const query = {
    sort: vi.fn(),
    session: vi.fn(),
    lean: vi.fn(),
    exec: vi.fn().mockResolvedValue([]),
  };
  query.sort.mockReturnValue(query);
  query.session.mockReturnValue(query);
  query.lean.mockReturnValue(query);

  const model = {
    find: vi.fn((_filter: Record<string, unknown>) => query),
    findOneAndUpdate: vi.fn(
      (_filter: unknown, _update: unknown, _options: unknown) => query,
    ),
  };

  return {
    repo: new MedicineBatchRepo(model as never),
    model,
    query,
  };
}

describe("MedicineBatchRepo", () => {
  describe("findSellableBatches", () => {
    it("filters to positive, unexpired, non-flagged stock", async () => {
      const { repo, model } = buildRepo();
      const before = Date.now();

      await repo.findSellableBatches(MEDICINE_ID);

      const filter = model.find.mock.calls[0]?.[0] as {
        medicineId: string;
        quantityRemaining: { $gt: number };
        expiryDate: { $gt: Date };
        isExpired: boolean;
      };
      expect(filter.medicineId).toBe(MEDICINE_ID);
      expect(filter.quantityRemaining).toEqual({ $gt: 0 });
      expect(filter.isExpired).toBe(false);
      expect(filter.expiryDate.$gt).toBeInstanceOf(Date);
      expect(filter.expiryDate.$gt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it("sorts by expiry date, then manufacturing date, then creation time (FEFO)", async () => {
      const { repo, query } = buildRepo();

      await repo.findSellableBatches(MEDICINE_ID);

      expect(query.sort).toHaveBeenCalledWith({
        expiryDate: 1,
        manufacturingDate: 1,
        createdAt: 1,
      });
    });

    it("scopes the query to the transaction session when provided", async () => {
      const { repo, query } = buildRepo();
      const session = { id: "session-1" };

      await repo.findSellableBatches(MEDICINE_ID, session as never);

      expect(query.session).toHaveBeenCalledWith(session);
    });
  });

  describe("getTotalStock", () => {
    it("applies the sellable filter without a session", async () => {
      const { repo, model } = buildRepo();

      await repo.getTotalStock(MEDICINE_ID);

      const filter = model.find.mock.calls[0]?.[0] as {
        medicineId: { $eq: string };
        quantityRemaining: { $gt: number };
        expiryDate: { $gt: Date };
        isExpired: boolean;
      };
      expect(filter.medicineId).toEqual({ $eq: MEDICINE_ID });
      expect(filter.quantityRemaining).toEqual({ $gt: 0 });
      expect(filter.isExpired).toBe(false);
      expect(filter.expiryDate.$gt).toBeInstanceOf(Date);
    });

    it("applies the same filter inside a session", async () => {
      const { repo, model, query } = buildRepo();
      const session = { id: "session-1" };

      await repo.getTotalStock(MEDICINE_ID, session as never);

      const filter = model.find.mock.calls[0]?.[0] as {
        quantityRemaining: { $gt: number };
        isExpired: boolean;
      };
      expect(filter.quantityRemaining).toEqual({ $gt: 0 });
      expect(filter.isExpired).toBe(false);
      expect(query.session).toHaveBeenCalledWith(session);
    });

    it("sums the remaining quantity of the returned batches", async () => {
      const { repo, query } = buildRepo();
      query.exec.mockResolvedValueOnce([
        { quantityRemaining: 3 },
        { quantityRemaining: 4 },
      ]);

      await expect(repo.getTotalStock(MEDICINE_ID)).resolves.toBe(7);
    });
  });

  describe("getExpiringUnits", () => {
    it("excludes already-expired stock with a lower date bound", async () => {
      const { repo, model } = buildRepo();
      const lower = new Date("2026-01-01T00:00:00Z");
      const upper = new Date("2026-02-01T00:00:00Z");

      await repo.getExpiringUnits(MEDICINE_ID, lower, upper);

      expect(model.find).toHaveBeenCalledWith({
        medicineId: MEDICINE_ID,
        expiryDate: { $gt: lower, $lte: upper },
        quantityRemaining: { $gt: 0 },
        isExpired: false,
      });
    });
  });

  describe("getUsableStock", () => {
    it("only counts positive, unexpired, non-flagged batches", async () => {
      const { repo, model } = buildRepo();
      const cutoff = new Date("2026-06-01T00:00:00Z");

      await repo.getUsableStock(MEDICINE_ID, cutoff);

      expect(model.find).toHaveBeenCalledWith({
        medicineId: MEDICINE_ID,
        expiryDate: { $gt: cutoff },
        quantityRemaining: { $gt: 0 },
        isExpired: false,
      });
    });
  });

  describe("deductBatchStock", () => {

    it("guards the decrement with a remaining-stock condition", async () => {
      const { repo, model } = buildRepo();

      await repo.deductBatchStock(BATCH_ID, 3);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: { $eq: BATCH_ID },
          quantityRemaining: { $gte: 3 },
        },
        {
          $inc: { quantityRemaining: -3 },
        },
        { new: true, session: null },
      );
    });

    it("binds the update to the transaction session", async () => {
      const { repo, model } = buildRepo();
      const session = { id: "session-1" };

      await repo.deductBatchStock(BATCH_ID, 1, session as never);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { new: true, session },
      );
    });
  });
});
