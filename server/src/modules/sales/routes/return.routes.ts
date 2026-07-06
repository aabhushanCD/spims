// return.routes.ts
import { Router } from "express";
import type { ReturnController } from "../controller/return.controller.ts";

export function buildReturnRouter(controller: ReturnController): Router {
  const router = Router();

  router.post("/", controller.createReturn);
  router.get("/", controller.getAllReturns);
  router.get("/:id", controller.getReturnById);
  router.patch("/:id", controller.updateReturn);
  // No DELETE — reversing a return would need its own stock-reversal logic, not implemented

  return router;
}
