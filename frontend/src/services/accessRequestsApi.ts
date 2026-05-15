import { http } from "./http";

export type AccessRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AccessRequest = {
  id: number;
  fullName: string;
  email: string;
  status: AccessRequestStatus;
  createdAt: string;
  decidedAt?: string | null;
  organization: { id: number; name: string; nit: string };
};

export type AccessRequestsListResponse = {
  data: AccessRequest[];
  total: number;
};

export const accessRequestsApi = {
  requestAccess: async (payload: {
    fullName: string;
    email: string;
    password: string;
    organizationNit: string;
  }) => {
    const { data } = await http.post<{ message: string }>("/access-requests", payload);
    return data;
  },

  list: async (params?: {
    status?: AccessRequestStatus;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await http.get<AccessRequestsListResponse>("/access-requests", { params });
    return data;
  },

  approve: async (id: number) => {
    const { data } = await http.patch<{ message: string }>(`/access-requests/${id}/approve`);
    return data;
  },

  reject: async (id: number) => {
    const { data } = await http.patch<{ message: string }>(`/access-requests/${id}/reject`);
    return data;
  }
};
