import { http } from "./http";

export type Organization = {
  id: number;
  name: string;
  nit: string;
  status: "ACTIVE" | "BANNED";
  bannedAt?: string | null;
  banReason?: string | null;
  createdAt: string;
};

export const organizationsApi = {
  list: async () => {
    const { data } = await http.get<Organization[]>("/orgs");
    return data;
  },
  create: async (payload: { name: string; nit: string }) => {
    const { data } = await http.post<Organization>("/orgs", payload);
    return data;
  },
  ban: async (id: number, reason: string) => {
    const { data } = await http.patch<Organization>(`/orgs/${id}/ban`, { reason });
    return data;
  },
  unban: async (id: number) => {
    const { data } = await http.patch<Organization>(`/orgs/${id}/unban`);
    return data;
  }
};