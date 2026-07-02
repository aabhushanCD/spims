import type { Request, Response } from "express";
import type { CreateUserDto } from "../../user/schema/user.schema.js";
import type { LoginInputDto } from "../schema/login.schema.js";
import type { AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async registerUser(req: Request, res: Response) {
    try {
      const user = await this.authService.registerUser(
        req.body as CreateUserDto,
      );
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async loginUser(req: Request, res: Response) {
    try {
      const user = await this.authService.loginUser(req.body as LoginInputDto);
      res.cookie("token", user.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.json(user);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async logoutUser(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const result = await this.authService.logoutUser(userId as string);
      res.clearCookie("token", { httpOnly: true, expires: new Date(0) });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
