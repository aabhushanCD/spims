import type { NextFunction, Request, Response } from "express";

import { getReportingTimeZone } from "../../../config/reporting.config.ts";

export class ConfigController {
  /**
   * Public, non-secret workspace configuration. The reporting timezone is the
   * single source of truth for both report boundaries and client-side date
   * display, so the client must be able to read it before authentication.
   */
  getWorkspaceConfig(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    try {
      res.status(200).json({
        reportingTimeZone: getReportingTimeZone(),
      });
    } catch (error) {
      next(error);
    }
  }
}
