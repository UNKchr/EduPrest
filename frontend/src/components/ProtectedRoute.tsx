import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import type { Role } from "../auth/roles";
import { hasMinRole } from "../auth/roles";

type Props = {
  children: ReactElement;
  minRole?: Role;
};

export const ProtectedRoute = ({ children, minRole }: Props) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (minRole && !hasMinRole(user.role, minRole)) return <Navigate to="/" replace />;
  return children;
};