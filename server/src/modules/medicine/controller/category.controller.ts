import type { NextFunction, Request, Response } from "express";
import type { CategoryService } from "../services/category.service.js";

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  async createCategory(req: Request, res: Response,next:NextFunction) {
    try {
      const categoryData = req.body;
      const newCategory =
        await this.categoryService.createCategory(categoryData);
      res.status(201).json(newCategory);
      } catch (error) {
   next(error);
    }
  }

  async getCategoryById(req: Request, res: Response,next:NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const category = await this.categoryService.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  }

  async getAllCategories(req: Request, res: Response,next:NextFunction) {
    try {
      const categories = await this.categoryService.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response,next:NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const updateData = req.body;
      const updatedCategory = await this.categoryService.updateCategory(
        id,
        updateData,
      );
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(200).json(updatedCategory);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response,next:NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const deletedCategory = await this.categoryService.deleteCategory(id);
      if (!deletedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  //   async deactivateCategory(req: any, res: any) {
  //     try {
  //       const { id } = req.params;
  //       const deactivatedCategory =
  //         await this.categoryService.deactivateCategory(id);
  //       if (!deactivatedCategory) {
  //         return res.status(404).json({ message: "Category not found" });
  //       }
  //       res.status(200).json({ message: "Category deactivated successfully" });
  //     } catch (error) {
  //       res.status(500).json({ message: "Failed to deactivate category", error });
  //     }
  //   }
}
