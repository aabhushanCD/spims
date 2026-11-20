import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/$/,
  "",
);

const defaultConfig = {
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
} as const;

/**
 * Authenticated client. The response interceptor is registered in
 * `fetch.api.ts`.
 */
const api = axios.create(defaultConfig);

/**
 * Raw client used by the refresh request. It deliberately has no interceptors
 * so a 401 from `/auth/refresh` cannot recurse.
 */
const rawApi = axios.create(defaultConfig);

export { api, rawApi, baseURL };
