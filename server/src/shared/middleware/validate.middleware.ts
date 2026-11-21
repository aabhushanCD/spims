import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

const invalid = (res: Response, error: { flatten: () => { fieldErrors: unknown } }) =>
  res.status(400).json({
    success: false,
    errors: error.flatten().fieldErrors,
  });

/**
 * Replaces a request property with a validated value.
 *
 * Express 5 defines `req.query` as a getter on the request prototype, so a
 * plain assignment is silently ignored. `Object.defineProperty` creates an own
 * writable property that the controller can read.
 */
function replaceRequestValue(
  req: Request,
  key: "body" | "params" | "query",
  value: unknown,
) {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return invalid(res, result.error);
    }

    replaceRequestValue(req, "body", result.data);
    next();
  };
};

export const validateParams = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return invalid(res, result.error);
    }

    replaceRequestValue(req, "params", result.data);
    next();
  };
};

export const validateQuery = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return invalid(res, result.error);
    }

    replaceRequestValue(req, "query", result.data);
    next();
  };
};
