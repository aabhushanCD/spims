/**
 * Shape returned by the Express API for successful responses.
 * `data` is the resource-specific payload.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
