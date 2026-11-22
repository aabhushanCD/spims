import type { SalesQueryParams } from "../types/sale.types";

/**
 * Builds the list query for `GET /sales`.
 *
 * The server validates `search` with `min(1)`, so an empty or whitespace-only
 * search must be omitted rather than sent as `search=`.
 */
export function buildSalesListParams(
  params: SalesQueryParams = {},
  limit = 100,
): { limit: number; search?: string } {
  const search = params.search?.trim();

  return {
    limit,
    ...(search ? { search } : {}),
  };
}
