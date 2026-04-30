import axios, { type AxiosRequestConfig } from "axios";
import { tokenStore } from "./tokenStore";
import { triggerLogout } from "./authEvents";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const http = axios.create({
  baseURL,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshRes = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshRes.data.accessToken;
        tokenStore.set(newToken);

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      } catch {
        tokenStore.clear();
        triggerLogout();
      }
    }

    return Promise.reject(error);
  }
);