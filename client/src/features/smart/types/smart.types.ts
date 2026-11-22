export type SmartReorderStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReorderRecommendation {
  _id: string;

  medicineId: {
    _id: string;
    medicineName: string;
    strength?: string;
  };

  supplierId?: string | { _id: string; companyName?: string };

  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  safetyStock: number;
  confidenceScore: number;
  recommendationReason: string;
  status: SmartReorderStatus;
  generatedAt: string;

  WADS?: number;
  demandStdDev?: number;
  adjustedLeadTime?: number;
  expiryRiskUnits?: number;

  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  purchaseOrderId?: string | null;
}

export interface ManualReorderInput {
  medicineId: string;
  supplierId: string;
  suggestedQuantity: number;
  confidenceScore: number;
  recommendationReason: string;
}

export type ReorderListStatus = SmartReorderStatus | "ALL";

export interface GenerateAllResult {
  results: {
    medicineId?: string;
    recommendationId?: string;
    status: "created" | "skipped";
    reason?: string;
  }[];
}
