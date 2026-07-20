import type { MedicineService } from "../services/medicine.sercive.js";
import type { NextFunction, Request, Response } from "express";
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}
  async createMedicine(req: Request, res: Response,next:NextFunction) {
    try {
      const medicineData = req.body;
      const newMedicine =
        await this.medicineService.createMedicine(medicineData);
      res.status(201).json(newMedicine);
    } catch (error) {
      next(error);
    }
  }

  async getMedicineById(req: Request, res: Response,next:NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const medicine = await this.medicineService.getMedicineById(id);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      res.status(200).json(medicine);
    } catch (error) {
      next(error);
    }
  }
  async searchMedicines(req: Request, res: Response,next:NextFunction) {
    try {
      const { query } = req.query as { query: string };
      const medicines = await this.medicineService.searchMedicines(query);
      res.status(200).json(medicines);
    } catch (error) {
      next(error);
    }
  }

  async getAllMedicines(req: Request, res: Response,next:NextFunction) {
    try {
      const medicines = await this.medicineService.getMedicines();
      res.status(200).json(medicines);
    } catch (error) {
      next(error);
    }
  }

  async updateMedicine(req: Request, res: Response,next:NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const updateData = req.body;
      const updatedMedicine = await this.medicineService.updateMedicine(
        id,
        updateData,
      );
      if (!updatedMedicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      res.status(200).json(updatedMedicine);
    } catch (error) {
      next(error);
    }
  }

  async deactivateMedicine(req: Request, res: Response,next:NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const deactivatedMedicine =
        await this.medicineService.deactivateMedicine(id);
      if (!deactivatedMedicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      res.status(200).json({ message: "Medicine deactivated successfully" });
    } catch (error) {
      next(error);
    }
  }
}
