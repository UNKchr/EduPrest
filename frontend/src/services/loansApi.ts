import { http } from "./http";
import type { Role } from "../auth/roles";

export type Loan = {
  id: number;
  userId: number;
  itemId: number;
  status: "ACTIVE" | "RETURNED" | "OVERDUE";
  loanedAt: string;
  dueAt: string;
  returnedAt?: string | null;
  user: { id: number; email: string; fullName: string; role: Role };
  item: { id: number; name: string; code: string };
};

export const loansApi = {
  list: async () => {
    const { data } = await http.get<Loan[]>("/loans");
    return data;
  },
  listMine: async () => {
    const { data } = await http.get<Loan[]>("/loans/my");
    return data;
  },
  create: async (payload: { userId: number; itemId: number; dueAt: string }) => {
    const { data } = await http.post<Loan>("/loans", payload);
    return data;
  },
  markReturned: async (id: number) => {
    const { data } = await http.patch<Loan>(`/loans/${id}/return`);
    return data;
  },
  updateStatus: async (id: number, status: Loan["status"]) => {
    const { data } = await http.patch<Loan>(`/loans/${id}/status`, { status });
    return data;
  }
};