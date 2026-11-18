import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);

      next();
    } catch (error) {
      const formattedErrors =
        error instanceof ZodError ? error.flatten().fieldErrors : undefined;

      // FIX 3: Add an explicit return to prevent further execution
      return res.status(400).json({
        success: false,
        errors: formattedErrors,
      });
    }
  };
};
