/**
 * Detects MongoDB duplicate-key errors (E11000).
 *
 * Driver errors are unknown at a `catch` boundary, so this narrows the value
 * structurally instead of casting it. Returning a boolean keeps callers free
 * of `any` while preserving the original error for re-throwing.
 */
export function isDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  return "code" in error && error.code === 11000;
}
