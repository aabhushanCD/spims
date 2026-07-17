import { api } from "@/api/fetch.api"

const getSales = async (params:any) => {
    const response = await api.get("/sales", { params });
    return response.data;
};

const getSaleById = async (saleId: string) => {
    const response = await api.get(`/sales/${saleId}`);
    return response.data;
}

const createSale = async (saleData: any) => {
    const response = await api.post("/sales", saleData);
    return response.data;
}

const cancelSale = async (saleId: string, reason?: string) => {
    const response = await api.patch(`/sales/${saleId}/cancel`, { reason });
    return response.data;
}


const updateSale = async (saleId: string, saleData: any) => {
    const response = await api.put(`/sales/${saleId}`, saleData);
    return response.data;
}

const deleteSale = async (saleId: string) => {
    const response = await api.delete(`/sales/${saleId}`);
    return response.data;
}

const searchMedicines = async (query: string) => {
    const response = await api.get("/inventory/medicines/search", {
      params: { query },
    });
    return response.data.data;
}


export const salesService = {
    getSales,
    getSaleById,
    createSale,
    updateSale,
    deleteSale,
    cancelSale,
    searchMedicines,
};