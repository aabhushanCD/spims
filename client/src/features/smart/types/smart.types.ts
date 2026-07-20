// types.ts

export interface ReorderRecommendation {
  _id: string;

  medicineId: {
    _id: string;
    medicineName: string;
    strength?: string;
  };

  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  safetyStock: number;
  confidenceScore: number;
  recommendationReason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  generatedAt: string;
}
