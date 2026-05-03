import { http } from "./http";
import { tokenStore } from "./tokenStore";
import type { Role } from "../auth/roles";

type LoginResponse = {
  accessToken: string;
  user: { id: number; email: string; role: Role; orgId: number };
};

type RefreshResponse = {
  accessToken: string;
  user: { id: number; email: string; role: Role; orgId: number };
};

export const authApi = {
  login: async (email: string, password: string, organizationNit: string) => {
    const { data } = await http.post<LoginResponse>("/auth/login", {
      email,
      password,
      organizationNit
    });
    tokenStore.set(data.accessToken);
    return data.user;
  },

  register: async (email: string, password: string, fullName: string, organizationNit: string) => {
    const { data } = await http.post<LoginResponse>("/auth/register", {
      email,
      password,
      fullName,
      organizationNit
    });
    tokenStore.set(data.accessToken);
    return data.user;
  },

  refresh: async () => {
    const { data } = await http.post<RefreshResponse>("/auth/refresh");
    tokenStore.set(data.accessToken);
    return data.user;
  },

  logout: async () => {
    await http.post("/auth/logout");
    tokenStore.clear();
  }
};