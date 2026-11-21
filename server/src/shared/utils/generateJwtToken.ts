import jwt from "jsonwebtoken";
import { logger } from "../logger.ts";

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}
export const generateJwtToken = (
  payload: JwtPayload,
  secret: string,
): string => {
  try {
    const token: string = jwt.sign(payload, secret ,{
        expiresIn: "15d"
    });
    return token;
  } catch (error) {
    logger.error("jwt_generation_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Failed to generate JWT token", { cause: error });
  }
};
