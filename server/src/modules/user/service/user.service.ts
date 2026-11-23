import bcrypt from "bcrypt";

import { AppError } from "../../../shared/error.js";
import type { IUser, UserRole } from "../model/user.model.js";
import type { UserRepository } from "../repo/user.repo.js";
import type {
  CreateUserDto,
  UpdateUserDto,
  UserListQuery,
} from "../schema/user.schema.js";
import {
  buildPage,
  decodeCursor,
} from "../../../shared/pagination/cursor.ts";
import type { AuthSessionRepo } from "../../auth/repo/authSession.repo.ts";
import type { AuthMailer } from "../../auth/services/auth.mailer.ts";
import {
  getClientUrl,
  getPasswordResetTtlMs,
} from "../../auth/utils/authConfig.ts";
import {
  generateOpaqueToken,
  hashToken,
} from "../../auth/utils/authTokens.ts";
import type { RequestContext } from "../../../shared/utils/requestContext.ts";
import { AUDIT_ACTIONS } from "../../audit/audit.constants.ts";
import {
  noopAuditRecorder,
  noopTokenVersionMaintenance,
  type AuditRecorder,
  type TokenVersionMaintenance,
} from "../../../shared/security/security.types.ts";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authSessionRepository?: AuthSessionRepo,
    private readonly mailer?: AuthMailer,
    private readonly audit: AuditRecorder = noopAuditRecorder,
    private readonly tokenVersionMaintenance: TokenVersionMaintenance = noopTokenVersionMaintenance,
  ) {}

  private assertOwner(actorRole: string): void {
    if (actorRole !== "owner") {
      throw AppError.forbidden("Only owners can manage users");
    }
  }

  private assertValidRole(role: string): void {
    if (!["inventory_manager", "owner", "pharmacist"].includes(role)) {
      throw AppError.badRequest("Invalid role specified");
    }
  }

  private async auditUserEvent(input: {
    action: string;
    actorId?: string | undefined;
    actorRole: string;
    entityId?: string | undefined;
    context?: RequestContext | undefined;
    status?: "SUCCESS" | "FAILURE";
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.audit.record({
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      entityType: "User",
      entityId: input.entityId,
      status: input.status ?? "SUCCESS",
      ip: input.context?.ip,
      userAgent: input.context?.userAgent,
      metadata: input.metadata,
    });
  }

  private async bumpTokenVersion(userId: string): Promise<void> {
    const tokenVersion = await this.userRepository.incrementTokenVersion(userId);
    if (tokenVersion !== null) {
      await this.tokenVersionMaintenance.invalidate(userId);
    }
  }

  private async revokeAllSessionsBestEffort(userId: string): Promise<void> {
    if (!this.authSessionRepository) {
      return;
    }
    try {
      await this.authSessionRepository.revokeAllForUser(userId);
    } catch {
      // Session cleanup is best-effort for account edits that must still
      // succeed (for example, deleting a user). Token-version bumps still
      // invalidate access tokens.
    }
  }

  async createUser(
    userData: CreateUserDto,
    actorRole: string,
    actorId?: string,
    context?: RequestContext,
  ): Promise<IUser> {
    this.assertOwner(actorRole);
    this.assertValidRole(userData.role);

    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw AppError.conflict("Email already exists");
    }

    const hashPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.userRepository.create({
      ...userData,
      password: hashPassword,
      // Users created by an owner from the dashboard are trusted accounts.
      emailVerified: true,
    });

    await this.auditUserEvent({
      action: AUDIT_ACTIONS.USER_CREATED,
      actorId,
      actorRole,
      entityId: String(user._id),
      context,
      metadata: { role: user.role, email: user.email },
    });

    return user;
  }

  async getUserById(id: string): Promise<IUser | null> {
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }
    return await this.userRepository.findById(id);
  }

  async updateUser(
    id: string,
    userData: UpdateUserDto,
    actorRole: string,
    actorId?: string,
    context?: RequestContext,
  ): Promise<IUser | null> {
    this.assertOwner(actorRole);
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }

    const updateData = { ...userData };
    const passwordChanged = Boolean(userData.password);
    const sessionInvalidatingChange =
      passwordChanged || userData.isActive === false;

    if (updateData.role) {
      this.assertValidRole(updateData.role);
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updated = await this.userRepository.update(id, updateData);
    if (!updated) {
      return null;
    }

    if (
      sessionInvalidatingChange ||
      updateData.role !== undefined
    ) {
      if (sessionInvalidatingChange) {
        await this.revokeAllSessionsBestEffort(id);
      }
      await this.bumpTokenVersion(id);
    }

    await this.auditUserEvent({
      action: AUDIT_ACTIONS.USER_UPDATED,
      actorId,
      actorRole,
      entityId: id,
      context,
      metadata: {
        fields: Object.keys(userData),
        passwordChanged,
      },
    });

    return updated;
  }

  async deleteUser(
    id: string,
    actorRole: string,
    actorId?: string,
    context?: RequestContext,
  ): Promise<IUser | null> {
    this.assertOwner(actorRole);
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }

    await this.revokeAllSessionsBestEffort(id);
    const deleted = await this.userRepository.delete(id);

    if (deleted) {
      await this.auditUserEvent({
        action: AUDIT_ACTIONS.USER_DELETED,
        actorId,
        actorRole,
        entityId: id,
        context,
      });
    }

    return deleted;
  }

  async changeRole(
    id: string,
    role: UserRole,
    actorRole: string,
    actorId?: string,
    context?: RequestContext,
  ): Promise<IUser | null> {
    this.assertOwner(actorRole);
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }
    this.assertValidRole(role);

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw AppError.notFound("User not found");
    }

    const updated = await this.userRepository.update(id, { role });
    if (updated) {
      // A role change must invalidate both access tokens and refresh sessions;
      // otherwise an old refresh token can mint a token with the new role.
      await this.revokeAllSessionsBestEffort(id);
      await this.bumpTokenVersion(id);
      await this.auditUserEvent({
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        actorId,
        actorRole,
        entityId: id,
        context,
        metadata: { from: user.role, to: role },
      });
    }

    return updated;
  }

  async getUserStats() {
    const [total, active, inactive, byRole] = await Promise.all([
      this.userRepository.countAll(),
      this.userRepository.countByStatus(true),
      this.userRepository.countByStatus(false),
      this.userRepository.countByRole(),
    ]);

    return { total, active, inactive, byRole };
  }

  async getUsersPage(query: UserListQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.userRepository.findPage(
      {
        ...(query.search ? { search: query.search } : {}),
        ...(query.role ? { role: query.role } : {}),
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      },
      cursor,
      query.limit + 1,
    );
    return buildPage(
      rows,
      query.limit,
      (row) => row.createdAt,
      (row) => String(row._id),
    );
  }

  async getAllUsers(): Promise<IUser[]> {
    return await this.userRepository.findAll();
  }

  async getUsersByRole(role: UserRole): Promise<IUser[]> {
    return await this.userRepository.findByRole(role);
  }

  async getActiveUsers(): Promise<IUser[]> {
    return await this.userRepository.findActiveUsers();
  }

  async getInactiveUsers(): Promise<IUser[]> {
    return await this.userRepository.findInactiveUsers();
  }

  async getUsersByStatusAndLastLogin(
    isActive: boolean,
    date: Date,
  ): Promise<IUser[]> {
    return await this.userRepository.findByStatusAndLastLogin(isActive, date);
  }

  async toggleUserActivation(
    userId: string,
    actorRole: string,
    actorId?: string,
    context?: RequestContext,
  ): Promise<void> {
    this.assertOwner(actorRole);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }

    const nextIsActive = !user.isActive;
    await this.userRepository.update(userId, { isActive: nextIsActive });

    if (!nextIsActive) {
      await this.revokeAllSessionsBestEffort(userId);
      await this.bumpTokenVersion(userId);
    }

    await this.auditUserEvent({
      action: AUDIT_ACTIONS.USER_ACTIVATION_TOGGLED,
      actorId,
      actorRole,
      entityId: userId,
      context,
      metadata: { isActive: nextIsActive },
    });
  }

  async adminResetPassword(
    userId: string,
    actorRole: string,
    actorId?: string,
    context?: RequestContext,
  ): Promise<{ message: string }> {
    this.assertOwner(actorRole);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    if (user.provider !== "local") {
      throw AppError.badRequest(
        "Password reset is only available for local accounts",
      );
    }
    if (!this.mailer) {
      throw AppError.serviceUnavailable(
        "Email delivery is not configured; cannot send a reset link",
      );
    }

    const resetToken = generateOpaqueToken();
    const now = Date.now();

    await this.userRepository.updateAuthFields(userId, {
      passwordResetTokenHash: hashToken(resetToken),
      passwordResetExpiresAt: new Date(now + getPasswordResetTtlMs()),
    });

    await this.authSessionRepository?.revokeAllForUser(userId);
    await this.bumpTokenVersion(userId);

    try {
      await this.mailer.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        url: `${getClientUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`,
      });
    } catch (error) {
      await this.userRepository.updateAuthFields(userId, {
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      });
      await this.auditUserEvent({
        action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
        actorId,
        actorRole,
        entityId: userId,
        context,
        status: "FAILURE",
        metadata: { reason: "email_delivery_failed" },
      });
      throw AppError.serviceUnavailable(
        "Could not send the password reset email. Please try again.",
      );
    }

    await this.auditUserEvent({
      action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
      actorId,
      actorRole,
      entityId: userId,
      context,
    });

    return {
      message:
        "Password reset link sent. The user must open it to choose a new password.",
    };
  }

  async forceLogout(
    userId: string,
    actorRole: string,
    actorId?: string,
    context?: RequestContext,
  ): Promise<{ message: string }> {
    this.assertOwner(actorRole);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }

    await this.authSessionRepository?.revokeAllForUser(userId);
    await this.bumpTokenVersion(userId);

    await this.auditUserEvent({
      action: AUDIT_ACTIONS.USER_FORCE_LOGOUT,
      actorId,
      actorRole,
      entityId: userId,
      context,
    });

    return { message: "All sessions for this user have been revoked" };
  }

  async getUsersByRoleAndLastLogin(
    role: UserRole,
    date: Date,
  ): Promise<IUser[]> {
    return await this.userRepository.findByRoleAndLastLogin(role, date);
  }

  async getUsersByRoleAndStatus(
    role: UserRole,
    isActive: boolean,
  ): Promise<IUser[]> {
    return await this.userRepository.findByRoleAndStatus(role, isActive);
  }

  async getUsersByLastLogin(date: Date): Promise<IUser[]> {
    return await this.userRepository.findUsersByLastLogin(date);
  }
}
