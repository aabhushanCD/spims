import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/error.ts";
import type { UserRole } from "../model/user.model.js";
import type {
  ChangeUserRoleDto,
  UserListQuery,
} from "../schema/user.schema.ts";
import type { UserService } from "../service/user.service.js";
import { toPublicUser } from "../utils/publicUser.ts";
import { extractRequestContext } from "../../../shared/utils/requestContext.ts";

export class UserController {
  constructor(private readonly userService: UserService) {}

  private actorRole(req: Request): string {
    const role = req.user?.role;
    if (!role) {
      throw AppError.unauthorized("Authenticated user required");
    }
    return role;
  }

  private actor(req: Request): { role: string; userId?: string } {
    return {
      role: this.actorRole(req),
      ...(req.user?.userId ? { userId: req.user.userId } : {}),
    };
  }

  async createUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const actor = this.actor(req);
      const newUser = await this.userService.createUser(
        req.body,
        actor.role,
        actor.userId,
        extractRequestContext(req),
      );
      res.status(201).json(toPublicUser(newUser));
    } catch (error) {
      next(error);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id as string;
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id as string;
      const actor = this.actor(req);
      const updatedUser = await this.userService.updateUser(
        userId,
        req.body,
        actor.role,
        actor.userId,
        extractRequestContext(req),
      );
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(toPublicUser(updatedUser));
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id as string;
      const actor = this.actor(req);
      const deletedUser = await this.userService.deleteUser(
        userId,
        actor.role,
        actor.userId,
        extractRequestContext(req),
      );
      if (!deletedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const stats = await this.userService.getUserStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = await this.userService.getUsersPage(
        req.query as unknown as UserListQuery,
      );
      res.status(200).json({
        success: true,
        data: {
          items: page.items.map((user) => toPublicUser(user)),
          nextCursor: page.nextCursor,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsersByRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const role = req.params.role as UserRole;
      const users = await this.userService.getUsersByRole(role);
      res.status(200).json(users.map((user) => toPublicUser(user)));
    } catch (error) {
      next(error);
    }
  }

  async getActiveUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const users = await this.userService.getActiveUsers();
      res.status(200).json(users.map((user) => toPublicUser(user)));
    } catch (error) {
      next(error);
    }
  }

  async getInactiveUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const users = await this.userService.getInactiveUsers();
      res.status(200).json(users.map((user) => toPublicUser(user)));
    } catch (error) {
      next(error);
    }
  }

  async getUsersByLastLogin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const date = new Date(req.params.date as string);
      const users = await this.userService.getUsersByLastLogin(date);
      res.status(200).json(users.map((user) => toPublicUser(user)));
    } catch (error) {
      next(error);
    }
  }

  async getUsersByRoleAndStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const role = req.params.role as UserRole;
      const isActive = req.params.isActive === "true";
      const users = await this.userService.getUsersByRoleAndStatus(
        role,
        isActive,
      );
      res.status(200).json(users.map((user) => toPublicUser(user)));
    } catch (error) {
      next(error);
    }
  }

  async getUsersByRoleAndLastLogin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const role = req.params.role as UserRole;
      const date = new Date(req.params.date as string);
      const users = await this.userService.getUsersByRoleAndLastLogin(
        role,
        date,
      );
      res.status(200).json(users.map((user) => toPublicUser(user)));
    } catch (error) {
      next(error);
    }
  }

  async getUsersByStatusAndLastLogin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const isActive = req.params.isActive === "true";
      const date = new Date(req.params.date as string);
      const users = await this.userService.getUsersByStatusAndLastLogin(
        isActive,
        date,
      );
      res.status(200).json(users.map((user) => toPublicUser(user)));
    } catch (error) {
      next(error);
    }
  }

  async toggleUserActivation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id as string;
      const actor = this.actor(req);
      await this.userService.toggleUserActivation(
        userId,
        actor.role,
        actor.userId,
        extractRequestContext(req),
      );
      res.status(200).json({ message: "User activation toggled successfully" });
    } catch (error) {
      next(error);
    }
  }

  async changeRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id as string;
      const { role } = req.body as ChangeUserRoleDto;
      const actor = this.actor(req);
      const updatedUser = await this.userService.changeRole(
        userId,
        role,
        actor.role,
        actor.userId,
        extractRequestContext(req),
      );
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(toPublicUser(updatedUser));
    } catch (error) {
      next(error);
    }
  }

  async resetUserPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id as string;
      const actor = this.actor(req);
      const result = await this.userService.adminResetPassword(
        userId,
        actor.role,
        actor.userId,
        extractRequestContext(req),
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async forceLogout(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id as string;
      const actor = this.actor(req);
      const result = await this.userService.forceLogout(
        userId,
        actor.role,
        actor.userId,
        extractRequestContext(req),
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
