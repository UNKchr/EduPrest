import { http } from "./http";
import { tokenStore } from "./tokenStore";
import type { Role } from "../auth/roles";

type LoginResponse = {
  accessToken: string;
  user: { id: number; email: string; role: Role };
};

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await http.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    tokenStore.set(data.accessToken);
    return data.user;
  },

  register: async (email: string, password: string, fullName: string) => {
    const { data } = await http.post<LoginResponse>("/auth/register", {
      email,
      password,
      fullName,
    });
    tokenStore.set(data.accessToken);
    return data.user;
  },

  refresh: async () => {
    const { data } = await http.post<{ accessToken: string }>("/auth/refresh");
    tokenStore.set(data.accessToken);
    return data.accessToken;
  },

  logout: async () => {
    await http.post("/auth/logout");
    tokenStore.clear();
  },
};