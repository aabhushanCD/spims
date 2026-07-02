import type { Request, Response } from "express";
import type {
  CreateGenericNameDto,
  UpdateGenericNameDto,
} from "../schema/genericName.schema.js";
import type { GenericNameService } from "../services/genericName.service.js";

export class GenericNameController {
  constructor(private readonly genericNameService: GenericNameService) {}
  async createGenericName(req: Request, res: Response) {
    try {
      const genericNameData = req.body as CreateGenericNameDto;
      const newGenericName =
        await this.genericNameService.createGenericName(genericNameData);
      res.status(201).json(newGenericName);
    } catch (error) {
      res.status(500).json({ message: "Failed to create generic name", error });
    }
  }
  async getGenericNameById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const genericName = await this.genericNameService.getGenericNameById(id);
      if (!genericName) {
        return res.status(404).json({ message: "Generic name not found" });
      }
      res.status(200).json(genericName);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to retrieve generic name", error });
    }
  }

  async getAllGenericNames(req: Request, res: Response) {
    try {
      const genericNames = await this.genericNameService.getAllGenericNames();
      res.status(200).json(genericNames);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to retrieve generic names", error });
    }
  }

  async updateGenericName(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const updateData = req.body as UpdateGenericNameDto;
      const updatedGenericName =
        await this.genericNameService.updateGenericName(id, updateData);
      if (!updatedGenericName) {
        return res.status(404).json({ message: "Generic name not found" });
      }
      res.status(200).json(updatedGenericName);
    } catch (error) {
      res.status(500).json({ message: "Failed to update generic name", error });
    }
  }

  async deleteGenericName(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const deletedGenericName =
        await this.genericNameService.deleteGenericName(id);
      if (!deletedGenericName) {
        return res.status(404).json({ message: "Generic name not found" });
      }
      res.status(200).json({ message: "Generic name deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete generic name", error });
    }
  }
}
