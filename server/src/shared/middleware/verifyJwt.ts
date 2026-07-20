
import type { JWTUserPayload } from "../../types/global.ts";
import jwt from "jsonwebtoken";

export const verifyJwt = (token: string) => {
  try {
    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    return decoded as JWTUserPayload;
  } catch (error) {
    console.error("Failed to verify JWT token:", error);
    throw new Error("Unauthorized: Invalid token");
  }
};
