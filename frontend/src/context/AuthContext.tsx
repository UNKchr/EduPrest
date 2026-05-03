import { createContext } from "react";
import type { Role } from "../auth/roles";

export type User = { id: number; email: string; role: Role; orgId: number };

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, organizationNit: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, organizationNit: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);