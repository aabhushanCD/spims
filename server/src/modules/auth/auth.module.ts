import { AuthService } from "./services/auth.service.js";
import { AuthController } from "./controller/auth.controller.js";
import { userRepository } from "../user/user.module.js";
import { AppError } from "../../shared/error.js";

const authService = new AuthService(userRepository, AppError);
const authController = new AuthController(authService);

export { authService, authController };
