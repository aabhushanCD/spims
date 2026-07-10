import axios from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // You can modify the request config here if needed
    return config;
  },
  (error) => {
    // Handle request errors here
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    // You can modify the response here if needed
    return response;
  },
  async (error) => {
    // Handle response errors here
    const status = error.response?.status;
    if (status === 401) {
      console.log("Unauthorized access. Redirecting to login page...");
    }
    return Promise.reject(error);
  },
);
export { api };
