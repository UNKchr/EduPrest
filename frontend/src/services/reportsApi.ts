import { http } from "./http";

export type WeekStat = { week: string; loans: number; returns: number };

export type ActivityRecord = {
  id: number;
  itemName: string;
  itemCode: string;
  userEmail: string;
  userFullName: string;
  orgName: string;
  loanedAt: string;
  dueAt: string;
  returnedAt: string | null;
  status: "ACTIVE" | "RETURNED" | "OVERDUE";
};

export type OrgStat = {
  id: number;
  name: string;
  nit: string;
  totalLoans: number;
  totalUsers: number;
  totalItems: number;
};

export type OrgAnalytics = {
  weeklyStats: WeekStat[];
  activeLoans: number;
  overdueLoans: number;
  availableItems: number;
  recentActivity: ActivityRecord[];
  orgs: OrgStat[] | null;
};

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
  },
  analytics: async () => {
    const { data } = await http.get<OrgAnalytics>("/reports/analytics");
    return data;
  }
};
