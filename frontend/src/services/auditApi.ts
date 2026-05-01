import { http } from "./http";
import type { Role } from "../auth/roles";

export type AuditLog = {
  id: number;
  action: string;
  entity: string;
  entityId?: number | null;
  createdAt: string;
  user?: { id: number; email: string; fullName: string; role: Role } | null;
};

export const auditApi = {
  list: async () => {
    const { data } = await http.get<AuditLog[]>("/audit");
    return data;
  }
};