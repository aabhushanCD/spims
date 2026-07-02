import type { Request, Response } from "express";
import type { BrandService } from "../services/brand.service.js";

export class BrandController {
  constructor(private readonly brandService: BrandService) {}
  async createBrand(req: Request, res: Response) {
    try {
      const brandData = req.body;
      const newBrand = await this.brandService.createBrand(brandData);
      res.status(201).json(newBrand);
    } catch (error) {
      res.status(500).json({ message: "Failed to create brand", error });
    }
  }

  async getBrandById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const brand = await this.brandService.getBrandById(id);
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }
      res.status(200).json(brand);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve brand", error });
    }
  }
  async getAllBrands(req: Request, res: Response) {
    try {
      const brands = await this.brandService.getAllBrands();
      res.status(200).json(brands);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve brands", error });
    }
  }
  async updateBrand(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const updateData = req.body;
      const updatedBrand = await this.brandService.updateBrand(id, updateData);
      if (!updatedBrand) {
        return res.status(404).json({ message: "Brand not found" });
      }
      res.status(200).json(updatedBrand);
    } catch (error) {
      res.status(500).json({ message: "Failed to update brand", error });
    }
  }

  async deleteBrand(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const deletedBrand = await this.brandService.deleteBrand(id);
      if (!deletedBrand) {
        return res.status(404).json({ message: "Brand not found" });
      }
      res.status(200).json({ message: "Brand deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete brand", error });
    }
  }
}
