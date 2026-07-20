import type { NextFunction, Request, Response } from "express";
import type { UserService } from "../service/user.service.js";

export class UserController {
  constructor(private readonly userService: UserService) {}

  async createUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userData = req.body;
      const newUser = await this.userService.createUser(userData);
      res.status(201).json(newUser);
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
      res.status(200).json(user);
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
      const userData = req.body;
      const updatedUser = await this.userService.updateUser(userId, userData);
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(updatedUser);
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
      const role = req.body.role as string;
      const deletedUser = await this.userService.deleteUser(userId, role);
      if (!deletedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json({ message: "User deleted successfully" });
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
      const users = await this.userService.getAllUsers();
      res.status(200).json(users);
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
      const role = req.params.role as
        | "owner"
        | "pharmacist"
        | "inventory_manager";
      const users = await this.userService.getUsersByRole(role);
      res.status(200).json(users);
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
      res.status(200).json(users);
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
      res.status(200).json(users);
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
      res.status(200).json(users);
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
      const role = req.params.role as
        | "owner"
        | "pharmacist"
        | "inventory_manager";
      const isActive = req.query.isActive === "true";
      const users = await this.userService.getUsersByRoleAndStatus(
        role,
        isActive,
      );
      res.status(200).json(users);
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
      const role = req.params.role as
        | "owner"
        | "pharmacist"
        | "inventory_manager";
      const date = new Date(req.params.date as string);
      const users = await this.userService.getUsersByRoleAndLastLogin(
        role,
        date,
      );
      res.status(200).json(users);
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
      const isActive = req.query.isActive === "true";
      const date = new Date(req.params.date as string);
      const users = await this.userService.getUsersByStatusAndLastLogin(
        isActive,
        date,
      );
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async findByStatusAndLastLogin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const isActive = req.query.isActive === "true";
      const date = new Date(req.params.date as string);
      const users = await this.userService.getUsersByStatusAndLastLogin(
        isActive,
        date,
      );
      res.status(200).json(users);
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
      await this.userService.toggleUserActivation(userId);
      res.status(200).json({ message: "User activation toggled successfully" });
    } catch (error) {
      next(error);
    }
  }
}
