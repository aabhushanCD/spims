export interface Medicine {
  _id: string;
  medicineName: string;
  manufacturer: string;
  barcode: string;
  strength: string;
  reorderLevel: number;
  genericName: string;
  brand: string;
  category: string;
  unit: string;
  currentStock: number;
  availableStock: number;
}
