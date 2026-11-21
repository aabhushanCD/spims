/**
 * Escapes regex metacharacters so user-supplied search text is treated as a
 * literal substring rather than an expression.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
