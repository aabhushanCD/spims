import { api } from "@/api/fetch.api";

import type { Medicine } from "../types/medicine.types";
import type { MedicineFormData } from "../schema/medicine.schema";


const getMedicines = async (): Promise<Medicine[]> => {
  const response = await api.get("/medicines");

  return response.data;
};

const createMedicine = async (data: MedicineFormData) => {
  const response = await api.post("/medicines", data);

  return response.data;
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

  createMedicine,

  updateMedicine,

  deleteMedicine,
};
