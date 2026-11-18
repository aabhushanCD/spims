import { api } from "@/api/fetch.api";
import type { SupplierForm } from "../schema/supplier.schema";
import type { Supplier } from "../types/supplier.types";

const getSupplier = async (): Promise<Supplier[]> => {
  const response = await api.get("/suppliers");
  return response.data.data;
};

const createSupplier = async (data: SupplierForm): Promise<Supplier> => {
  const response = await api.post("/suppliers", data);
  return response.data.data;
};

const updateSupplier = async ({
  id,
  data,
}: {
  id: string;
  data: SupplierForm;
}): Promise<Supplier> => {
  const response = await api.put(`/suppliers/${id}`, data);
  return response.data.data;
};

const deleteSupplier = async (id: string): Promise<Supplier> => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data.data;
};

export const supplierService = {
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
