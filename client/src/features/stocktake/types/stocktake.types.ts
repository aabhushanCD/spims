export type StocktakeStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface StocktakeItem {
  _id?: string;
  batchId: string;
  medicineId: string;
  systemQuantity: number;
  countedQuantity: number;
  variance: number;
  remarks?: string;
}

export interface Stocktake {
  _id: string;
  stocktakeNumber: string;
  status: StocktakeStatus;
  startedBy: string;
  completedBy?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  items: StocktakeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StocktakeItemInput {
  batchId: string;
  countedQuantity: number;
  remarks?: string;
}

export interface StocktakeInput {
  items: StocktakeItemInput[];
  notes?: string;
}

export interface StocktakeListParams {
  status?: StocktakeStatus;
}
