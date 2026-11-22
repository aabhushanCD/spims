import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";

const { fakeRedis } = vi.hoisted(() => {
  const store = new Map<string, string>();
  const expiries = new Map<string, number>();
  const live = (key: string) => {
    const expiry = expiries.get(key);
    if (expiry !== undefined && expiry <= Date.now()) {
      store.delete(key);
      expiries.delete(key);
      return false;
    }
    return true;
  };
  return {
    fakeRedis: {
      async get(key: string) {
        return live(key) ? (store.get(key) ?? null) : null;
      },
      async set(key: string, value: string, ...args: unknown[]) {
        store.set(key, value);
        const exIndex = args.indexOf("EX");
        if (exIndex >= 0) {
          expiries.set(key, Date.now() + Number(args[exIndex + 1]) * 1000);
        }
        const pxIndex = args.indexOf("PX");
        if (pxIndex >= 0) {
          expiries.set(key, Date.now() + Number(args[pxIndex + 1]));
        }
        return "OK";
      },
      async del(...keys: string[]) {
        for (const key of keys) {
          store.delete(key);
          expiries.delete(key);
        }
        return keys.length;
      },
      async exists(key: string) {
        return live(key) && store.has(key) ? 1 : 0;
      },
      async ttl(key: string) {
        if (!live(key) || !store.has(key)) {
          return -2;
        }
        const expiry = expiries.get(key);
        return expiry ? Math.max(0, Math.ceil((expiry - Date.now()) / 1000)) : -1;
      },
      async incr(key: string) {
        const next = Number(store.get(key) ?? 0) + 1;
        store.set(key, String(next));
        return next;
      },
      async pexpire(key: string, milliseconds: number) {
        expiries.set(key, Date.now() + milliseconds);
        return 1;
      },
      async ping() {
        return "PONG";
      },
      on() {},
      async eval() {
        return 0;
      },
      flushAll() {
        store.clear();
        expiries.clear();
      },
    },
  };
});

vi.mock("../../src/config/redis.config.ts", () => ({
  default: fakeRedis,
  resolveRedisTarget: () => ({ options: {} }),
}));

import { Medicine } from "../../src/modules/medicine/models/medicine.model.ts";
import Supplier from "../../src/modules/supplier/model/supplier.model.ts";
import { User } from "../../src/modules/user/model/user.model.ts";
import Sales from "../../src/modules/sales/model/sales.model.ts";
import SalesItem from "../../src/modules/sales/model/salesItem.model.ts";
import Batch from "../../src/modules/batch/model/medicineBatch.model.ts";
import Inventory from "../../src/modules/inventory/model/inventory.model.ts";
import InventoryMovement from "../../src/modules/inventory/model/inventoryMovement.model.ts";
import PurchaseOrder from "../../src/modules/purchase/model/purchaseOrder.model.ts";
import SmartReorder from "../../src/modules/smartReorder/model/smartReorder.model.ts";
import AuditLog from "../../src/modules/audit/model/auditLog.model.ts";
import { generateAccessToken } from "../../src/modules/auth/utils/authTokens.ts";

let replSet: MongoMemoryReplSet | undefined;
let app: ReturnType<typeof import("../../src/app/createApp.ts").createApp>;
let ownerId: string;
let authCookie: string;

async function seedOwner(): Promise<void> {
  const owner = await User.create({
    name: "Integration Owner",
    email: `owner-${new Types.ObjectId().toString()}@test.local`,
    password: "not-used-by-token-tests",
    role: "owner",
    emailVerified: true,
    isActive: true,
  });
  ownerId = owner._id.toString();
  const token = generateAccessToken({
    userId: ownerId,
    email: owner.email,
    role: "owner",
    sessionId: new Types.ObjectId().toString(),
    ver: 0,
  });
  authCookie = `token=${token}`;
}

const CSRF_TOKEN = "integration-csrf-token";

function authenticated(req: request.Test): request.Test {
  return req
    .set("Cookie", `${authCookie}; csrfToken=${CSRF_TOKEN}`)
    .set("X-CSRF-Token", CSRF_TOKEN);
}

async function seedMedicine(name = "Paracetamol"): Promise<string> {
  const medicine = await Medicine.create({
    medicineName: name,
    genericNameId: new Types.ObjectId(),
    categoryId: new Types.ObjectId(),
    brandId: new Types.ObjectId(),
    unitId: new Types.ObjectId(),
    strength: "500mg",
    reorderLevel: 10,
    isActive: true,
  });
  return medicine._id.toString();
}

async function seedSupplier(): Promise<string> {
  const suffix = new Types.ObjectId().toString();
  const supplier = await Supplier.create({
    companyName: "Integration Supplier",
    contactPerson: "Test Contact",
    email: `supplier-${suffix}@test.local`,
    phone: `9${suffix.slice(-9)}`,
    address: "Test address",
    leadTime: 2,
    status: "active",
  });
  return supplier._id.toString();
}

async function seedReceivedStock(
  medicineId: string,
  quantity: number,
  expiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
): Promise<{ batchId: string; purchaseOrderId: string }> {
  const supplierId = await seedSupplier();
  const purchaseOrder = await PurchaseOrder.create({
    supplierId,
    orderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expectedDeliveryDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    receivedDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
    invoiceNumber: `INV-${new Types.ObjectId().toString()}`,
    totalAmount: quantity * 5,
    status: "received",
    VAT: 13,
    discount: 0,
  });
  const batch = await Batch.create({
    medicineId,
    purchaseOrderId: purchaseOrder._id,
    batchNumber: `B-${new Types.ObjectId().toString()}`,
    expiryDate: expiry,
    manufacturingDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    purchasePrice: 5,
    sellingPrice: 10,
    quantityReceived: Math.max(quantity, 1),
    quantityRemaining: quantity,
    isExpired: false,
    isActive: true,
  });
  const inventory = await Inventory.findOne({ medicineId });
  if (inventory) {
    const nextStock = inventory.currentStock + quantity;
    inventory.currentStock = nextStock;
    inventory.availableStock = nextStock - inventory.reservedStock;
    inventory.lastUpdated = new Date();
    await inventory.save();
  } else {
    await Inventory.create({
      medicineId,
      currentStock: quantity,
      reservedStock: 0,
      availableStock: quantity,
      lastUpdated: new Date(),
    });
  }
  return {
    batchId: batch._id.toString(),
    purchaseOrderId: purchaseOrder._id.toString(),
  };
}

beforeAll(async () => {
  process.env.JWT_SECRET = "integration-test-jwt-secret-32-bytes-minimum";
  process.env.JWT_REFRESH_SECRET =
    "integration-test-refresh-secret-32-bytes-minimum";
  process.env.CLIENT_URL = "http://localhost:5173";

  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await mongoose.connect(replSet.getUri("spims_phase5"));
  await Promise.all([
    Medicine.init(),
    Supplier.init(),
    User.init(),
    Sales.init(),
    SalesItem.init(),
    Batch.init(),
    Inventory.init(),
    InventoryMovement.init(),
    PurchaseOrder.init(),
    SmartReorder.init(),
    AuditLog.init(),
  ]);
  const { createApp } = await import("../../src/app/createApp.ts");
  app = createApp({
    mongo: async () => true,
    redis: async () => true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

beforeEach(async () => {
  fakeRedis.flushAll();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is unavailable");
  }
  // Delete documents rather than dropping the database: dropping it also
  // removes the unique indexes these flows depend on.
  const collections = await db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  await seedOwner();
});

describe("HTTP integration flows", () => {
  it("sets Helmet security headers on public routes", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBeDefined();
  });

  it("serves the OpenAPI JSON and Swagger UI outside production", async () => {
    const json = await request(app).get("/api-docs/openapi.json");
    expect(json.status).toBe(200);
    expect(json.body.paths["/auth/login"]).toBeDefined();
    expect(json.body.components.securitySchemes.cookieAuth).toBeDefined();

    const ui = await request(app).get("/api-docs/");
    expect(ui.status).toBe(200);
    expect(ui.headers["content-type"]).toContain("text/html");
  });

  it("completes a purchase receipt with batch, aggregate, and movement", async () => {
    const medicineId = await seedMedicine();
    const supplierId = await seedSupplier();

    const createResponse = await authenticated(
      request(app).post("/api/purchases"),
    ).send({
      supplierId,
      orderDate: new Date().toISOString(),
      invoiceNumber: `PO-${new Types.ObjectId().toString()}`,
      VAT: 13,
      discount: 0,
      items: [{ medicineId, quantity: 12, purchasePrice: 5 }],
    });
    expect(createResponse.status).toBe(201);
    const purchaseOrderId = createResponse.body.data._id as string;

    expect(
      (
        await authenticated(
          request(app).patch(`/api/purchases/${purchaseOrderId}/approve`),
        )
      ).status,
    ).toBe(200);

    const receiveBody = {
      items: [
        {
          medicineId,
          batchNumber: `B-${new Types.ObjectId().toString()}`,
          manufacturingDate: new Date(
            Date.now() - 60 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          expiryDate: new Date(
            Date.now() + 180 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          sellingPrice: 10,
          quantityReceived: 12,
        },
      ],
    };
    const receiveResponse = await authenticated(
      request(app).post(`/api/purchases/${purchaseOrderId}/receive`),
    ).send(receiveBody);
    expect(receiveResponse.status).toBe(200);

    const inventory = await Inventory.findOne({ medicineId }).lean();
    expect(inventory?.currentStock).toBe(12);
    expect(await InventoryMovement.countDocuments({ medicineId })).toBe(1);
    expect(await Batch.countDocuments({ medicineId })).toBe(1);

    const duplicateReceive = await authenticated(
      request(app).post(`/api/purchases/${purchaseOrderId}/receive`),
    ).send(receiveBody);
    expect(duplicateReceive.status).toBe(400);
  });

  it("sells with FEFO, records one movement, and enforces an idempotency key", async () => {
    const medicineId = await seedMedicine("Amoxicillin");
    await seedReceivedStock(medicineId, 10, new Date(Date.now() + 60 * 86_400_000));
    await seedReceivedStock(medicineId, 10, new Date(Date.now() + 120 * 86_400_000));

    const key = `sale-key-${new Types.ObjectId().toString()}`;
    const saleBody = {
      customerName: "Integration Customer",
      paymentMethod: "CASH",
      saleDate: new Date().toISOString(),
      discount: 0,
      items: [{ medicineId, quantity: 4, discountPercentage: 0 }],
    };

    const first = await authenticated(request(app).post("/api/sales"))
      .set("Idempotency-Key", key)
      .send(saleBody);
    expect(first.status).toBe(201);
    const second = await authenticated(request(app).post("/api/sales"))
      .set("Idempotency-Key", key)
      .send(saleBody);
    expect(second.status).toBe(201);
    expect(second.body.data._id).toBe(first.body.data._id);

    const inventory = await Inventory.findOne({ medicineId }).lean();
    expect(inventory?.currentStock).toBe(16);
    const saleItems = await SalesItem.find({ salesId: first.body.data._id }).lean();
    expect(saleItems).toHaveLength(1);
    expect(saleItems[0]?.quantity).toBe(4);
    expect(await Sales.countDocuments()).toBe(1);
    expect(await InventoryMovement.countDocuments({ medicineId })).toBeGreaterThanOrEqual(1);
  });

  it("accepts multiple sales without idempotency keys", async () => {
    const medicineId = await seedMedicine("Keyless Sale Medicine");
    await seedReceivedStock(medicineId, 10);
    const saleBody = {
      customerName: "Keyless Customer",
      paymentMethod: "CASH",
      saleDate: new Date().toISOString(),
      discount: 0,
      items: [{ medicineId, quantity: 1, discountPercentage: 0 }],
    };

    const first = await authenticated(request(app).post("/api/sales")).send(
      saleBody,
    );
    const second = await authenticated(request(app).post("/api/sales")).send(
      saleBody,
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data._id).not.toBe(first.body.data._id);
    expect(await Sales.countDocuments()).toBe(2);
  });

  it("completes a GOOD return and restores the original batch", async () => {
    const medicineId = await seedMedicine("Cetirizine");
    await seedReceivedStock(medicineId, 10);

    const saleResponse = await authenticated(request(app).post("/api/sales")).send({
      customerName: "Return Customer",
      paymentMethod: "CASH",
      saleDate: new Date().toISOString(),
      discount: 0,
      items: [{ medicineId, quantity: 3, discountPercentage: 0 }],
    });
    expect(saleResponse.status).toBe(201);
    const saleId = saleResponse.body.data._id as string;
    const saleItem = await SalesItem.findOne({ salesId: saleId }).lean();
    expect(saleItem).not.toBeNull();

    const returnResponse = await authenticated(request(app).post("/api/returns")).send({
      salesId: saleId,
      returnReason: "Customer changed their mind",
      returnedBy: ownerId,
      returnDate: new Date().toISOString(),
      items: [
        {
          saleItemId: saleItem!._id.toString(),
          quantity: 1,
          condition: "GOOD",
        },
      ],
    });
    expect(returnResponse.status).toBe(201);
    const returnId = returnResponse.body.data._id as string;

    expect(
      (
        await authenticated(
          request(app).patch(`/api/returns/${returnId}/approve`),
        )
      ).status,
    ).toBe(200);
    const completed = await authenticated(
      request(app).patch(`/api/returns/${returnId}/complete`),
    );
    expect(completed.status).toBe(200);

    const inventory = await Inventory.findOne({ medicineId }).lean();
    expect(inventory?.currentStock).toBe(8);
    expect(
      await InventoryMovement.countDocuments({ referenceId: returnId }),
    ).toBe(1);
  });

  it("marks expired batches and disposes them through the HTTP flow", async () => {
    const medicineId = await seedMedicine("Expired Medicine");
    const supplierId = await seedSupplier();
    const purchaseOrder = await PurchaseOrder.create({
      supplierId,
      orderDate: new Date(Date.now() - 400 * 86_400_000),
      invoiceNumber: `EXP-${new Types.ObjectId().toString()}`,
      totalAmount: 20,
      status: "received",
      VAT: 13,
      discount: 0,
    });
    const batch = await Batch.create({
      medicineId,
      purchaseOrderId: purchaseOrder._id,
      batchNumber: `EXP-B-${new Types.ObjectId().toString()}`,
      expiryDate: new Date(Date.now() - 2 * 86_400_000),
      manufacturingDate: new Date(Date.now() - 400 * 86_400_000),
      purchasePrice: 5,
      sellingPrice: 10,
      quantityReceived: 4,
      quantityRemaining: 4,
      isExpired: false,
      isActive: true,
    });

    expect(
      (
        await authenticated(
          request(app).post("/api/batches/mark-expired"),
        )
      ).status,
    ).toBe(200);
    const marked = await Batch.findById(batch._id).lean();
    expect(marked?.isExpired).toBe(true);

    const disposal = await authenticated(
      request(app).post(`/api/batches/${batch._id.toString()}/confirm-disposal`),
    ).send({ remarks: "Integration disposal" });
    expect(disposal.status).toBe(200);

    const disposed = await Batch.findById(batch._id).lean();
    expect(disposed?.quantityRemaining).toBe(0);
    expect(
      await InventoryMovement.countDocuments({
        batchId: batch._id,
        movementType: "EXPIRED",
      }),
    ).toBe(1);
    const inventory = await Inventory.findOne({ medicineId }).lean();
    expect(inventory?.currentStock).toBe(0);
  });

  it("links a customer, settles a credit sale, and returns an invoice payload", async () => {
    const medicineId = await seedMedicine("Customer Sale Medicine");
    await seedReceivedStock(medicineId, 10);

    const customer = await authenticated(
      request(app).post("/api/customers"),
    ).send({
      name: "Registered Customer",
      phone: "+9779800000000",
    });
    expect(customer.status).toBe(201);
    const customerId = customer.body.data._id as string;

    const sale = await authenticated(request(app).post("/api/sales")).send({
      customerId,
      paymentMethod: "CREDIT",
      saleDate: new Date().toISOString(),
      items: [{ medicineId, quantity: 2 }],
    });
    expect(sale.status).toBe(201);
    expect(sale.body.data.customerName).toBe("Registered Customer");
    const saleId = sale.body.data._id as string;
    expect(sale.body.data.customerId).toBe(customerId);

    const invoice = await authenticated(
      request(app).get(`/api/sales/${saleId}/invoice`),
    );
    expect(invoice.status).toBe(200);
    expect(invoice.body.data.sale.customerId.name).toBe(
      "Registered Customer",
    );
    expect(invoice.body.data.items[0].medicineId.medicineName).toBe(
      "Customer Sale Medicine",
    );
    expect(invoice.body.data.summary.amountDue).toBe(
      sale.body.data.totalAmount,
    );

    const payment = await authenticated(
      request(app).post(`/api/sales/${saleId}/payments`),
    ).send({
      amount: sale.body.data.totalAmount,
      method: "CASH",
    });
    expect(payment.status).toBe(201);

    const settled = await authenticated(
      request(app).get(`/api/sales/${saleId}/payments`),
    );
    expect(settled.status).toBe(200);
    expect(settled.body.data.summary.amountDue).toBe(0);
  });

  it("generates one recommendation per medicine and keeps negative cache semantics", async () => {
    const medicineId = await seedMedicine("Reorder Medicine");
    const supplierId = await seedSupplier();
    const purchaseOrder = await PurchaseOrder.create({
      supplierId,
      orderDate: new Date(Date.now() - 30 * 86_400_000),
      expectedDeliveryDate: new Date(Date.now() - 10 * 86_400_000),
      receivedDate: new Date(Date.now() - 9 * 86_400_000),
      invoiceNumber: `RO-${new Types.ObjectId().toString()}`,
      totalAmount: 10,
      status: "received",
      VAT: 13,
      discount: 0,
    });
    await Batch.create({
      medicineId,
      purchaseOrderId: purchaseOrder._id,
      batchNumber: `RO-B-${new Types.ObjectId().toString()}`,
      expiryDate: new Date(Date.now() + 200 * 86_400_000),
      manufacturingDate: new Date(Date.now() - 60 * 86_400_000),
      purchasePrice: 5,
      sellingPrice: 10,
      quantityReceived: 1,
      quantityRemaining: 0,
      isExpired: false,
      isActive: true,
    });
    const sale = await Sales.create({
      invoiceNumber: `S-${new Types.ObjectId().toString()}`,
      customerName: "Sales History",
      subTotal: 100,
      VAT: 13,
      discount: 0,
      totalAmount: 113,
      paymentMethod: "CASH",
      cashierId: ownerId,
      saleDate: new Date(),
      status: "COMPLETED",
    });
    await SalesItem.create({
      salesId: sale._id,
      batchId: new Types.ObjectId(),
      medicineId,
      quantity: 30,
      unitPrice: 10,
      discount: 0,
      totalPrice: 300,
    });

    const first = await authenticated(
      request(app).post(`/api/smart-reorders/generate/${medicineId}`),
    );
    expect(first.status).toBe(201);
    const second = await authenticated(
      request(app).post(`/api/smart-reorders/generate/${medicineId}`),
    );
    expect(second.status).toBe(201);
    expect(
      await SmartReorder.countDocuments({ medicineId, status: "PENDING" }),
    ).toBe(1);

    const overstockedId = await seedMedicine("Overstocked Medicine");
    await seedReceivedStock(overstockedId, 1000);
    const negativeFirst = await authenticated(
      request(app).post(`/api/smart-reorders/generate/${overstockedId}`),
    );
    expect(negativeFirst.status).toBe(400);
    const negativeSecond = await authenticated(
      request(app).post(`/api/smart-reorders/generate/${overstockedId}`),
    );
    expect(negativeSecond.status).toBe(400);
  });

  it("invalidates access tokens on force logout and writes an audit row", async () => {
    const target = await User.create({
      name: "Force Logout Target",
      email: `target-${new Types.ObjectId().toString()}@test.local`,
      password: "not-used-by-token-tests",
      role: "pharmacist",
      emailVerified: true,
      isActive: true,
      tokenVersion: 0,
    });
    const targetId = target._id.toString();
    const targetToken = generateAccessToken({
      userId: targetId,
      email: target.email,
      role: "pharmacist",
      sessionId: new Types.ObjectId().toString(),
      ver: 0,
    });
    const targetCookie = `token=${targetToken}`;

    const before = await request(app)
      .get("/api/auth/me")
      .set("Cookie", targetCookie);
    expect(before.status).toBe(200);

    const response = await authenticated(
      request(app).post(`/api/users/${targetId}/force-logout`),
    ).send({});
    expect(response.status).toBe(200);

    const after = await request(app)
      .get("/api/auth/me")
      .set("Cookie", targetCookie);
    expect(after.status).toBe(401);
    expect(after.body).toMatchObject({ code: "SESSION_REVOKED" });

    const audit = await AuditLog.findOne({
      action: "USER_FORCE_LOGOUT",
      entityId: targetId,
    }).lean();
    expect(audit).not.toBeNull();
  });
});
