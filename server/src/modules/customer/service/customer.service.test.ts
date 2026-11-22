import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerService } from "./customer.service.ts";

const CUSTOMER_ID = "507f1f77bcf86cd799439011";

function buildService() {
  const customerRepo = {
    create: vi.fn().mockImplementation(async (data) => data),
    findById: vi.fn(),
    findPage: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return {
    service: new CustomerService(customerRepo as never),
    customerRepo,
  };
}

describe("CustomerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a customer", async () => {
    const { service, customerRepo } = buildService();

    await service.create({ name: "Asha Sharma", phone: "+9779800000000" });

    expect(customerRepo.create).toHaveBeenCalledWith({
      name: "Asha Sharma",
      phone: "+9779800000000",
    });
  });

  it("returns a customer by id", async () => {
    const { service, customerRepo } = buildService();
    customerRepo.findById.mockResolvedValue({ _id: CUSTOMER_ID });

    await expect(service.getById(CUSTOMER_ID)).resolves.toMatchObject({
      _id: CUSTOMER_ID,
    });
  });

  it("returns 404 for an unknown customer", async () => {
    const { service, customerRepo } = buildService();
    customerRepo.findById.mockResolvedValue(null);

    await expect(service.getById(CUSTOMER_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("rejects an update when the customer is missing", async () => {
    const { service, customerRepo } = buildService();
    customerRepo.update.mockResolvedValue(null);

    await expect(
      service.update(CUSTOMER_ID, { name: "Updated" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects a delete when the customer is missing", async () => {
    const { service, customerRepo } = buildService();
    customerRepo.delete.mockResolvedValue(null);

    await expect(service.delete(CUSTOMER_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
