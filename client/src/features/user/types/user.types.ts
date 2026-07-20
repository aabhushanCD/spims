export interface User {
    _id: string;

    fullName: string;

    email: string;

    phone: string;

    role: "owner"
        | "inventory_manager"
        | "pharmacist";

    isActive: boolean;

    createdAt: string;
}