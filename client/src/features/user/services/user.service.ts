import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type { SignupFormData } from "@/features/auth/schema/signup.schema";
import type { User, UserRole } from "../types/user.types";

export interface UserPage {
  items: User[];
  nextCursor: string | null;
}

export interface UserListParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  cursor?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

const getUser = async (userId: string): Promise<User> => {
  const response = await api.get<User>(`/users/${userId}`);
  return response.data;
};

const getUsersPage = async (
  params: UserListParams = {},
): Promise<UserPage> => {
  const search = params.search?.trim();

  const response = await api.get<ApiResponse<UserPage>>("/users", {
    params: {
      limit: 20,
      ...(search ? { search } : {}),
      ...(params.role ? { role: params.role } : {}),
      ...(params.isActive !== undefined
        ? { isActive: params.isActive }
        : {}),
      ...(params.cursor ? { cursor: params.cursor } : {}),
    },
  });

  return response.data.data;
};

const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<ApiResponse<UserPage>>("/users", {
    params: { limit: 100 },
  });
  return response.data.data.items;
};

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
}

const getUserStats = async (): Promise<UserStats> => {
  const response = await api.get<ApiResponse<UserStats>>("/users/stats");
  return response.data.data;
};

const getActiveUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users/active");
  return response.data;
};

const getInactiveUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users/inactive");
  return response.data;
};

const updateUser = async (
  userId: string,
  userData: UpdateUserInput,
): Promise<User> => {
  const response = await api.put<User>(`/users/${userId}`, userData);
  return response.data;
};

const createUser = async (userData: SignupFormData): Promise<User> => {
  const response = await api.post<User>("/users", userData);
  return response.data;
};

const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};

const toggleUserActivation = async (userId: string): Promise<void> => {
  await api.patch(`/users/${userId}/toggleUserActivation`);
};

const changeRole = async (
  userId: string,
  newRole: UserRole,
): Promise<User> => {
  const response = await api.patch<User>(`/users/${userId}/role`, {
    role: newRole,
  });
  return response.data;
};

const resetUserPassword = async (userId: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    `/users/${userId}/reset-password`,
  );
  return response.data;
};

const forceLogout = async (userId: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    `/users/${userId}/force-logout`,
  );
  return response.data;
};

export const userService = {
  getUser,
  getUsersPage,
  getAllUsers,
  getUserStats,
  getActiveUsers,
  getInactiveUsers,
  updateUser,
  createUser,
  deleteUser,
  toggleUserActivation,
  changeRole,
  resetUserPassword,
  forceLogout,
};
