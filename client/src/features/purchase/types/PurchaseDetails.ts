type PopulatedSupplier = {
  _id: string;
  name: string;
  contactPerson: string;
  contactNumber: string;
  email?: string;
  address?: string;
};

type PurchaseStatus = "PENDING" | "RECEIVED" | "CANCELLED";

type PurchaseItem = {
  _id: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};


export interface PurchaseDetails {
  _id: string;

  purchaseOrderNumber: string;

  supplier: PopulatedSupplier;

  invoiceNumber?: string;

  purchaseDate: string;

  expectedDeliveryDate?: string;

  notes?: string;

  totalAmount: number;

  status: PurchaseStatus;

  items: PurchaseItem[];

  createdAt: string;

  updatedAt: string;
}
