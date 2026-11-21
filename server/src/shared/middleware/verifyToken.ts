import type { NextFunction, Request, Response } from "express";

import type { JWTUserPayload } from "../../types/global.js";
import { verifyJwt } from "./verifyJwt.ts";
import { logger } from "../logger.ts";

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
    logger.warn("jwt_verification_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
