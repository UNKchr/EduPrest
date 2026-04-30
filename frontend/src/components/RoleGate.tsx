import type { ReactNode } from "react";
import { useAuth } from "../context/useAuth";
import type { Role } from "../auth/roles";
import { hasRole } from "../auth/roles";

type Props = {
  allowed: Role[];
  children: ReactNode;
};

export const RoleGate = ({ allowed, children}: Props) => {
  const { user } = useAuth();
  if (!user) return null;
  return hasRole(user.role, allowed) ? <>{children}</> : null;
}