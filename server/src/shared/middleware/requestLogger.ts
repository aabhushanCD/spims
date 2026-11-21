import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../logger.ts";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers["x-request-id"];
  const requestId =
    typeof incoming === "string" && incoming.length > 0
      ? incoming
      : crypto.randomUUID();
  res.setHeader("X-Request-Id", requestId);

  const startedAt = Date.now();
  res.on("finish", () => {
    const level = res.statusCode >= 500 ? "error" : "info";
    logger[level]("http_request", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.userId,
    });
  });

  next();
}
