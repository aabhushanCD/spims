import type { PurchaseStatus } from "../types/PurchaseDetails";

export interface PurchaseListParams {
  search?: string;
  status?: PurchaseStatus;
  supplierId?: string;
  from?: string;
  to?: string;
  cursor?: string;
}

/**
 * Builds the purchase-order list query.
 *
 * The server validates `search` with `min(1)`, so blank searches must be
 * omitted rather than sent as `search=`.
 */
export function buildPurchaseListParams(
  params: PurchaseListParams = {},
  limit = 20,
): Record<string, string | number> {
  const search = params.search?.trim();

  return {
    limit,
    ...(search ? { search } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.supplierId ? { supplierId: params.supplierId } : {}),
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
    ...(params.cursor ? { cursor: params.cursor } : {}),
  };
}
