import { api } from "@/api/fetch.api";

import type { MasterData, MasterDataResource } from "../types/masterData.types";
import type { MasterDataForm } from "../schema/masterData.schema";


const getAll = async (resource: MasterDataResource): Promise<MasterData[]> => {
  const res = await api.get(`/${resource}`);
 
  return res.data;
};

const create = async (
  resource: MasterDataResource,
  data: MasterDataForm,
): Promise<MasterData> => {
  const res = await api.post(`/${resource}`, data);
  return res.data;
};

const update = async (
  resource: MasterDataResource,
  id: string,
  data: MasterDataForm,
): Promise<MasterData> => {
  const res = await api.put(`/${resource}/${id}`, data);
  return res.data;
};

const remove = async (resource: MasterDataResource, id: string) => {
  return api.delete(`/${resource}/${id}`);
};

export const masterDataService = {
  getAll,
  create,
  update,
  remove,
};
