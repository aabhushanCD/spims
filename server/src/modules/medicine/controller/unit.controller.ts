import type { NextFunction, Request, Response } from "express";
import type { UnitService } from "../services/unit.service.js";

export class UnitController {
  constructor(private readonly unitService: UnitService) {}
  async createUnit(req: Request, res: Response,next:NextFunction) {
    try {
      const unitData = req.body;
      const newUnit = await this.unitService.createUnit(unitData);
      res.status(201).json(newUnit);
    } catch (error) {
      next(error);
    }
  }

  async getUnitById(req: Request, res: Response,next:NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const unit = await this.unitService.getUnitById(id);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      res.status(200).json(unit);
    } catch (error) {
      next(error);
    }
  }

  async getAllUnits(req: Request, res: Response,next:NextFunction) {
    try {
      const units = await this.unitService.getAllUnits();
      res.status(200).json(units);
    } catch (error) {
      next(error);
    }
  }

  async updateUnit(req: Request, res: Response,next:NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const updateData = req.body;
      const updatedUnit = await this.unitService.updateUnit(id, updateData);
      if (!updatedUnit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      res.status(200).json(updatedUnit);
    } catch (error) {
      next(error);
    }
  }

  async deleteUnit(req: Request, res: Response,next:NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const deletedUnit = await this.unitService.deleteUnit(id);
      if (!deletedUnit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      res.status(200).json({ message: "Unit deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
