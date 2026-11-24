import type { IUser, UserRole } from "../model/user.model.ts";
import {
  normalizeUserPreferences,
  type UserPreferences,
} from "../types/preferences.ts";

export interface PublicUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  provider: "local" | "google";
  lastLogin: Date | null;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export type UserLike = Pick<
  IUser,
  | "name"
  | "email"
  | "role"
  | "isActive"
  | "provider"
  | "lastLogin"
  | "createdAt"
  | "updatedAt"
> & {
  _id: unknown;
  emailVerified?: boolean | null;
  preferences?: Partial<UserPreferences> | null;
};

export function toPublicUser(user: UserLike): PublicUser {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified !== false,
    provider: user.provider,
    lastLogin: user.lastLogin,
    preferences: normalizeUserPreferences(user.preferences),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
