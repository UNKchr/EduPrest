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

export const reportsApi = {
  summary: async () => {
    const { data } = await http.get<SummaryReport>("/reports/summary");
    return data;
  }
};