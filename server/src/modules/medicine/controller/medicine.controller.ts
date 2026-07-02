import type { MedicineService } from "../services/medicine.sercive.js";

export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}
  async createMedicine(req: any, res: any) {
    try {
      const medicineData = req.body;
      const newMedicine =
        await this.medicineService.createMedicine(medicineData);
      res.status(201).json(newMedicine);
    } catch (error) {
      res.status(500).json({ message: "Failed to create medicine", error });
    }
  }

  async getMedicineById(req: any, res: any) {
    try {
      const { id } = req.params;
      const medicine = await this.medicineService.getMedicineById(id);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      res.status(200).json(medicine);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve medicine", error });
    }
  }

  async getAllMedicines(req: any, res: any) {
    try {
      const medicines = await this.medicineService.getAllMedicines();
      res.status(200).json(medicines);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve medicines", error });
    }
  }

  async updateMedicine(req: any, res: any) {
    try {
      const { id } = req.params;
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
      res.status(500).json({ message: "Failed to update medicine", error });
    }
  }

  async deactivateMedicine(req: any, res: any) {
    try {
      const { id } = req.params;
      const deactivatedMedicine =
        await this.medicineService.deactivateMedicine(id);
      if (!deactivatedMedicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      res.status(200).json({ message: "Medicine deactivated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate medicine", error });
    }
  }
}
