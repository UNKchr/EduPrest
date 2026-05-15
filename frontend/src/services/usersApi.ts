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

export type UsersListResponse = {
  data: UserRow[];
  total: number;
};

export const usersApi = {
  list: async (params?: {
    q?: string;
    role?: Role;
    orgId?: number;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await http.get<UsersListResponse>("/users", { params });
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
  updateRole: async (id: number, role: Role, reason: string, confirm: string) => {
    const { data } = await http.patch<UserRow>(`/users/${id}/role`, { role, reason, confirm });
    return data;
  },
  ban: async (id: number, reason: string, confirm: string) => {
    const { data } = await http.patch<UserRow>(`/users/${id}/ban`, { reason, confirm });
    return data;
  },
  unban: async (id: number, reason: string, confirm: string) => {
    const { data } = await http.patch<UserRow>(`/users/${id}/unban`, { reason, confirm });
    return data;
  },
  remove: async (id: number, confirm: string) => {
    const { data } = await http.delete<{ message: string }>(`/users/${id}`, {
      data: { confirm }
    });
    return data;
  }
};