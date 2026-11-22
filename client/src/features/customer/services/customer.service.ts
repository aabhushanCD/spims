import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type { Customer, CustomerForm } from "../types/customer.types";

export interface CustomerPage {
  items: Customer[];
  nextCursor: string | null;
}

const getCustomers = async (
  search = "",
  cursor?: string,
): Promise<CustomerPage> => {
  const query = search.trim();

  const response = await api.get<ApiResponse<CustomerPage>>("/customers", {
    params: {
      limit: 100,
      ...(query ? { search: query } : {}),
      ...(cursor ? { cursor } : {}),
    },
  });

  return response.data.data;
};

const getCustomerById = async (id: string): Promise<Customer> => {
  const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
  return response.data.data;
};

const createCustomer = async (data: CustomerForm): Promise<Customer> => {
  const response = await api.post<ApiResponse<Customer>>("/customers", data);
  return response.data.data;
};

const updateCustomer = async (
  id: string,
  data: Partial<CustomerForm>,
): Promise<Customer> => {
  const response = await api.put<ApiResponse<Customer>>(
    `/customers/${id}`,
    data,
  );
  return response.data.data;
};

const deleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`/customers/${id}`);
};

export const customerService = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
