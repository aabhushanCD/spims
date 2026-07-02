import * as express from "express";

export interface JWTUserPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTUserPayload | null;
    }
  }
}
