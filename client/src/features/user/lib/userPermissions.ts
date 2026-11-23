import type { Role } from "@/lib/permissions";

export function canManageUsers(role?: Role | null): boolean {
  return role === "owner";
}

/**
 * The server currently permits an owner to target their own account. The
 * client blocks self-destructive actions to avoid locking the pharmacy out.
 */
export function canActOnUser(
  actorId: string | undefined,
  targetId: string,
): boolean {
  return Boolean(actorId) && actorId !== targetId;
}
