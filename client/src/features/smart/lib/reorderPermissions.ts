import type { Role } from "@/lib/permissions";
import type { SmartReorderStatus } from "../types/smart.types";

export function canManageRecommendations(role?: Role | null): boolean {
  return role === "owner" || role === "inventory_manager";
}

export function canDeleteRecommendations(role?: Role | null): boolean {
  return role === "owner";
}

export function canActOnRecommendation(
  role: Role | null | undefined,
  status: SmartReorderStatus,
): boolean {
  return status === "PENDING" && canManageRecommendations(role);
}
