export interface Supplier {
  _id: string;

  companyName: string;

  contactPerson?: string;

  email?: string;

  phone: string;

  status: "active" | "inactive";

  leadTime: number;

  address?: string;

  panNumber?: string;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
}
