import { AppError } from "../../../shared/error.js";
import type { IUnit } from "../models/unit.model.js";
import type { UnitRepo } from "../repo/unit.repo.js";
import type { CreateUnitDto, UpdateUnitDto } from "../schema/unit.schema.js";

export class UnitService {
  constructor(
    private readonly unitRepo:typeof UnitRepo,
    private readonly appError: typeof AppError,
  ) {}

  async createUnit(unitData: CreateUnitDto): Promise<IUnit> {
    const existingUnit = await this.unitRepo.findByName(unitData.name);
    if (existingUnit) {
      throw this.appError.conflict("Unit name must be unique");
    }
    try {
      return await this.unitRepo.create(unitData);
    } catch (error: any) {
      if (error.code === 11000) {
        throw this.appError.conflict("Unit name must be unique");
      }
      throw error;
    }
  }

  async getUnitById(id: string): Promise<IUnit | null> {
    const unit = await this.unitRepo.findById(id);
    if (!unit) {
      throw this.appError.notFound("Unit not found");
    }
    return unit;
  }

  async getAllUnits(): Promise<IUnit[]> {
    return this.unitRepo.findAll();
  }

  async updateUnit(
    id: string,
    updateData: UpdateUnitDto,
  ): Promise<IUnit | null> {
    if (Object.keys(updateData).length === 0) {
      throw this.appError.badRequest("No data provided for update");
    }
    const existingUnit = await this.unitRepo.findById(id);
    if (!existingUnit) {
      throw this.appError.notFound("Unit not found");
    }

    return this.unitRepo.update(id, updateData);
  }

  async deleteUnit(id: string): Promise<IUnit | null> {
    await this.getUnitById(id);
    return this.unitRepo.delete(id);
  }
}
