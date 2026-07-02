import type { Request, Response } from "express";
import type { UnitService } from "../services/unit.service.js";

export class UnitController {
  constructor(private readonly unitService: UnitService) {}
  async createUnit(req: Request, res: Response) {
    try {
      const unitData = req.body;
      const newUnit = await this.unitService.createUnit(unitData);
      res.status(201).json(newUnit);
    } catch (error) {
      res.status(500).json({ message: "Failed to create unit", error });
    }
  }

  async getUnitById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const unit = await this.unitService.getUnitById(id);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      res.status(200).json(unit);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve unit", error });
    }
  }

  async getAllUnits(req: Request, res: Response) {
    try {
      const units = await this.unitService.getAllUnits();
      res.status(200).json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve units", error });
    }
  }

  async updateUnit(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const updateData = req.body;
      const updatedUnit = await this.unitService.updateUnit(id, updateData);
      if (!updatedUnit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      res.status(200).json(updatedUnit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update unit", error });
    }
  }

  async deleteUnit(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const deletedUnit = await this.unitService.deleteUnit(id);
      if (!deletedUnit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      res.status(200).json({ message: "Unit deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete unit", error });
    }
  }
}
