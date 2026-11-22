import { api } from "@/api/fetch.api";

import type { Medicine } from "../types/medicine.types";
import type { MedicineFormData } from "../schema/medicine.schema";

export interface MedicinePage {
  items: Medicine[];
  nextCursor: string | null;
}

const getMedicinePage = async (
  search = "",
  cursor?: string,
): Promise<MedicinePage> => {
  const response = await api.get<{
    success: boolean;
    data: MedicinePage;
  }>("/medicines", {
    params: {
      limit: 20,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(cursor ? { cursor } : {}),
    },
  });

  return response.data.data;
};

const getMedicines = async (): Promise<Medicine[]> => {
  const response = await api.get<{
    success: boolean;
    data: { items: Medicine[]; nextCursor: string | null };
  }>("/medicines?limit=100");

  return response.data.data.items;
};

const createMedicine = async (data: MedicineFormData) => {
  const response = await api.post("/medicines", data);

  return response.data;
};

const getMedicineByBarcode = async (barcode: string): Promise<Medicine> => {
  const response = await api.get<{ success: boolean; data: Medicine }>(
    `/medicines/barcode/${encodeURIComponent(barcode)}`,
  );
  return response.data.data;
};

const updateMedicine = async (id: string, data: Partial<MedicineFormData>) => {
  const response = await api.put(`/medicines/${id}`, data);

  return response.data;
};

const deleteMedicine = async (id: string) => {
  const response = await api.delete(`/medicines/${id}`);

  return response.data;
};

export const medicineServices = {
  getMedicines,
  getMedicinePage,
  getMedicineByBarcode,

  createMedicine,

  updateMedicine,

  deleteMedicine,
};
