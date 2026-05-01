import { http } from "./http";
import type { Role } from "../auth/roles";

export type UserRow = {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  status: "ACTIVE" | "BANNED";
  organizationId: number;
};

export const usersApi = {
  list: async () => {
    const { data } = await http.get<UserRow[]>("/users");
    return data;
  },
  create: async (payload: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
    organizationId?: number;
  }) => {
    const { data } = await http.post<UserRow>("/users", payload);
    return data;
  },
  updateRole: async (id: number, role: Role) => {
    const { data } = await http.patch<UserRow>(`/users/${id}/role`, { role });
    return data;
  },
  ban: async (id: number, reason: string) => {
    const { data } = await http.patch<UserRow>(`/users/${id}/ban`, { reason });
    return data;
  },
  unban: async (id: number) => {
    const { data } = await http.patch<UserRow>(`/users/${id}/unban`);
    return data;
  }
};