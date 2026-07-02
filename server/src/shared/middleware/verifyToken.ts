import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JWTUserPayload } from "../../types/global.js";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    req.user = decoded as JWTUserPayload;
    next();
  } catch (error) {
    console.error("Failed to verify JWT token:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
