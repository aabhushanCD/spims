import type { NextFunction, Request, Response } from "express";

import type { AuditService } from "../service/audit.service.ts";
import type { AuditQuery } from "../schema/audit.schema.ts";

export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  async getLogs(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = await this.auditService.getPage(
        req.query as unknown as AuditQuery,
      );
      res.status(200).json({
        success: true,
        data: {
          items: page.items,
          nextCursor: page.nextCursor,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
