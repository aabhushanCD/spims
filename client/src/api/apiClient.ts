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
function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const entry = part.trim();
    if (entry.startsWith(prefix)) {
      return decodeURIComponent(entry.slice(prefix.length));
    }
  }
  return null;
}

const api = axios.create(defaultConfig);

// Mirror the non-HttpOnly CSRF cookie into the header expected by the API for
// unsafe methods. Login/register/refresh are exempt on the server because they
// run before a session exists.
api.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    const token = readCookie("csrfToken");
    if (token) {
      config.headers.set("X-CSRF-Token", token);
    }
  }
  return config;
});

/**
 * Raw client used by the refresh request. It deliberately has no interceptors
 * so a 401 from `/auth/refresh` cannot recurse.
 */
const rawApi = axios.create(defaultConfig);

export { api, rawApi, baseURL };
