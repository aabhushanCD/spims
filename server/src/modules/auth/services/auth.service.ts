import { AppError } from "../../../shared/error.js";
import type { UserRepository } from "../../user/repo/user.repo.js";
import type { CreateUserDto } from "../../user/schema/user.schema.js";
import bcrypt from "bcrypt";

import type { LoginInputDto } from "../schema/login.schema.js";
import { generateJwtToken } from "../../../shared/utils/generateJwtToken.js";
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly appError: typeof AppError,
  ) {}

  async registerUser(userData: CreateUserDto) {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw this.appError.conflict("User already exists");
    }
    userData.password = await bcrypt.hash(userData.password, 10);
    const user = await this.userRepository.create(userData);
    return user;
  }

  async loginUser(loginData: LoginInputDto) {
    const { email, password } = loginData;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw this.appError.notFound("User not found");
    }
    if (!user.password) {
      throw this.appError.badRequest("User does not have a password set");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw this.appError.unauthorized("Invalid password");
    }
    const token = await generateJwtToken(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
    );
    return { ...user, token };
  }

  async logoutUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw this.appError.notFound("User not found");
    }
    // Perform any necessary logout operations, such as clearing session or token
    return { message: "User logged out successfully" };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw this.appError.notFound("User not found");
    }

    // Validate the refresh token and generate a new access token
    // This is a placeholder implementation; actual implementation may vary
    const newAccessToken = "newAccessToken"; // Replace with actual token generation logic
    return { accessToken: newAccessToken };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw this.appError.notFound("User not found");
    }
    return user;
  }
}
