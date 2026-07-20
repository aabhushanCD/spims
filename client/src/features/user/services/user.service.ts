import { api } from "@/api/fetch.api";
import type { User } from "@/features/auth/context/authContext";
import type { SignupFormData } from "@/features/auth/schema/signup.schema";

const getUser = async (userId: string): Promise<User> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

const updateUser = async (
  userId: string,
  userData: Partial<User>,
): Promise<User> => {
  const response = await api.put(`/users/${userId}`, userData);
  return response.data;
};

const toggleUserActivation = async (userId: string): Promise<void> => {
  await api.patch(`/users/${userId}/toggleUserActivation`);
};

const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get(`/users`);
  return response.data;
};

const createUser = async (userData: SignupFormData): Promise<User> => {
  const response = await api.post(`/users`, userData);
  return response.data;
};

const changeRole = async (userId: string, newRole: User["role"]) => {
  const response = await api.patch(`/users/${userId}/role`, { role: newRole });
  return response.data;
};

export const userService = {
  getUser,
  updateUser,
  toggleUserActivation,
  getAllUsers,
  createUser,
  changeRole,
};
