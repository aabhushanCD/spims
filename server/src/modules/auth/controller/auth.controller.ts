import type { NextFunction, Request, Response } from "express";
import type { CreateUserDto } from "../../user/schema/user.schema.js";
import type { LoginInputDto } from "../schema/login.schema.js";
import type { AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.authService.registerUser(
        req.body as CreateUserDto,
      );
      res.status(201).json(user);
    } catch (error: any) {
      next(error);
    }
  }

  async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.authService.loginUser(req.body as LoginInputDto);
      res.cookie("token", user.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.json(user);
    } catch (error: any) {
      next(error);
    }
  }

  async logoutUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const result = await this.authService.logoutUser(userId as string);
      res.clearCookie("token", { httpOnly: true, expires: new Date(0) });
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const user = await this.authService.getCurrentUser(userId as string);
      res.json(user);
    } catch (error: any) {
      next(error);
    }
  }
}
