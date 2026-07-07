import type { AppError } from "../../../shared/error.js";
import type { GenericNameRepo } from "../repo/genericName.repo.js";
import type {
  CreateGenericNameDto,
  UpdateGenericNameDto,
} from "../schema/genericName.schema.js";

export class GenericNameService {
  constructor(
    private readonly genericNameRepo: GenericNameRepo,
    private readonly appError: typeof AppError,
  ) {}

  async createGenericName(genericNameData: CreateGenericNameDto) {
    const existingGenericName = await this.genericNameRepo.findByName(
      genericNameData.name,
    );
    if (existingGenericName) {
      throw this.appError.conflict("Generic name must be unique");
    }
    try {
      return await this.genericNameRepo.create(genericNameData);
    } catch (error: any) {
      if (error.code === 11000) {
        throw this.appError.conflict("Generic name must be unique");
      }
      throw error;
    }
  }

  async getGenericNameById(id: string) {
    const genericName = await this.genericNameRepo.findById(id);
    if (!genericName) {
      throw this.appError.notFound("Generic name not found");
    }
    return genericName;
  }

  async getAllGenericNames() {
    return await this.genericNameRepo.findAll();
  }

  async updateGenericName(id: string, updateData: UpdateGenericNameDto) {
    const existingGenericName = await this.genericNameRepo.findById(id);
    if (!existingGenericName) {
      throw this.appError.notFound("Generic name not found");
    }
    return this.genericNameRepo.update(id, updateData);
  }

  async deleteGenericName(id: string) {
    const existingGenericName = await this.genericNameRepo.findById(id);
    if (!existingGenericName) {
      throw this.appError.notFound("Generic name not found");
    }
    return this.genericNameRepo.delete(id);
  }
}
