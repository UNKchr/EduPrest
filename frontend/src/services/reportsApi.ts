import { http } from "./http";

export type SummaryReport = {
  items: { totalItems: number; activeItems: number };
  loans: {
    totalLoans: number;
    activeLoans: number;
    returnedLoans: number;
    overdueLoans: number;
  };
  topItems: { itemId: number; name: string; code: string; totalLoans: number }[];
};

export type DashboardMetrics = {
  activeLoans: number;
  availableItems: number;
  bannedUsers: number;
};

export type AdminSummary = {
  activeUsers: number;
  pendingReports: number;
  availableItems: number;
};

export const reportsApi = {
  dashboard: async () => {
    const { data } = await http.get<DashboardMetrics>("/reports/dashboard");
    return data;
  },
  adminSummary: async () => {
    const { data } = await http.get<AdminSummary>("/reports/admin-summary");
    return data;
  },
  summary: async () => {
    const { data } = await http.get<SummaryReport>("/reports/summary");
    return data;
  }
};