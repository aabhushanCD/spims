export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerForm {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}
