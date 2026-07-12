export type MasterDataResource =
  "generic-names" | "categories" | "brands" | "units";

export interface MasterData {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MasterDataConfig {
  resource: MasterDataResource;
  pageTitle: string;
  entityName: string;
  description: string;
  isActive: boolean;
  
}

export const MASTER_DATA = {
  genericNames: {
    resource: "generic-names",
    pageTitle: "Generic Names",
    entityName: "Generic Name",
    description: "Generic Name",
    isActive: true,
  },

  categories: {
    resource: "categories",
    pageTitle: "Categories",
    entityName: "Category",
    description: "Category",
    isActive: true,
  },

  brands: {
    resource: "brands",
    pageTitle: "Brands",
    entityName: "Brand",
    description: "Brand",
    isActive: true,
  },

  units: {
    resource: "units",
    pageTitle: "Units",
    entityName: "Unit",
    description: "Unit",
    isActive: true,
  },
} satisfies Record<string, MasterDataConfig>;