import { http } from "./http";

export type ReportStatus = "PENDING" | "APPROVED" | "REJECTED";

export type UserReport = {
  id: number;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  user: { id: number; email: string; fullName: string };
  reportedBy: { id: number; email: string; fullName: string };
};

export const userReportsApi = {
  create: async (payload: { userId: number; reason: string }) => {
    const { data } = await http.post<UserReport>("/user-reports", payload);
    return data;
  },
  list: async () => {
    const { data } = await http.get<UserReport[]>("/user-reports");
    return data;
  },
  updateStatus: async (id: number, status: ReportStatus) => {
    const { data } = await http.patch<UserReport>(`/user-reports/${id}/status`, { status });
    return data;
  }
};