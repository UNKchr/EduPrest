import { http } from "./http";

export type OrgRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type OrgRequest = {
  id: number;
  orgName: string;
  orgNit: string;
  requesterName: string;
  requesterEmail: string;
  status: OrgRequestStatus;
  createdAt: string;
  decidedAt?: string | null;
};

export type OrgRequestsListResponse = {
  data: OrgRequest[];
  total: number;
};

export const orgRequestsApi = {
  requestOrg: async (payload: {
    orgName: string;
    orgNit: string;
    requesterName: string;
    requesterEmail: string;
  }) => {
    const { data } = await http.post<{ message: string }>("/org-requests", payload);
    return data;
  },

  list: async (params?: {
    status?: OrgRequestStatus;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await http.get<OrgRequestsListResponse>("/org-requests", { params });
    return data;
  },

  approve: async (id: number) => {
    const { data } = await http.patch<{ message: string }>(`/org-requests/${id}/approve`);
    return data;
  },

  reject: async (id: number) => {
    const { data } = await http.patch<{ message: string }>(`/org-requests/${id}/reject`);
    return data;
  }
};
