export type UserRole = "owner" | "inventory_manager" | "pharmacist";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  provider: "local" | "google";
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}
