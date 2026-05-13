import { http } from "./http";
import type { Role } from "../auth/roles";

export type BanRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type BanRequest = {
  id: number;
  reason: string;
  status: BanRequestStatus;
  createdAt: string;
  decidedAt?: string | null;
  decisionNote?: string | null;
  organization: { id: number; name: string; nit: string };
  requestedBy: { id: number; email: string; fullName: string; role: Role };
  targetUser: { id: number; email: string; fullName: string; role: Role; status: "ACTIVE" | "BANNED" };
  decidedBy?: { id: number; email: string; fullName: string; role: Role } | null;
};

export type BanRequestsListResponse = {
  data: BanRequest[];
  total: number;
};

export const banRequestsApi = {
  list: async (params?: {
    status?: BanRequestStatus;
    organizationId?: number;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await http.get<BanRequestsListResponse>("/ban-requests", { params });
    return data;
  },
  create: async (payload: { targetUserId: number; reason: string }) => {
    const { data } = await http.post<BanRequest>("/ban-requests", payload);
    return data;
  },
  approve: async (id: number, decisionNote?: string) => {
    const { data } = await http.patch<BanRequest>(`/ban-requests/${id}/approve`, {
      decisionNote
    });
    return data;
  },
  reject: async (id: number, decisionNote?: string) => {
    const { data } = await http.patch<BanRequest>(`/ban-requests/${id}/reject`, {
      decisionNote
    });
    return data;
  }
};
