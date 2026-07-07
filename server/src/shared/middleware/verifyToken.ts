import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JWTUserPayload } from "../../types/global.js";
import dotenv from "dotenv";
import { verifyJwt } from "./verifyJwt.ts";
dotenv.config();

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.token;
    req.user = verifyJwt(token) as JWTUserPayload;
    next();
  } catch (error) {
    console.error("Failed to verify JWT token:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
