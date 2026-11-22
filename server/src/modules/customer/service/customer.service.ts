import { AppError } from "../../../shared/error.ts";
import { buildPage, decodeCursor } from "../../../shared/pagination/cursor.ts";
import type { ICustomer } from "../model/customer.model.ts";
import type { CustomerRepo } from "../repo/customer.repo.ts";
import type {
  CreateCustomerDto,
  CustomerListQuery,
  UpdateCustomerDto,
} from "../schema/customer.schema.ts";

export class CustomerService {
  constructor(private readonly customerRepo: CustomerRepo) {}

  async create(data: CreateCustomerDto): Promise<ICustomer> {
    return await this.customerRepo.create({
      name: data.name,
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });
  }

  async getById(id: string): Promise<ICustomer> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw AppError.notFound("Customer not found");
    }
    return customer;
  }

  async getPage(query: CustomerListQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.customerRepo.findPage(
      {
        ...(query.search ? { search: query.search } : {}),
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      },
      cursor,
      query.limit + 1,
    );
    return buildPage(
      rows,
      query.limit,
      (row) => row.createdAt,
      (row) => String(row._id),
    );
  }

  async update(id: string, data: UpdateCustomerDto): Promise<ICustomer> {
    const updated = await this.customerRepo.update(id, data);
    if (!updated) {
      throw AppError.notFound("Customer not found");
    }
    return updated;
  }

  async delete(id: string): Promise<ICustomer> {
    const deleted = await this.customerRepo.delete(id);
    if (!deleted) {
      throw AppError.notFound("Customer not found");
    }
    return deleted;
  }
}
