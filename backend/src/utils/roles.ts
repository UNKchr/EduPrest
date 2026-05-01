export type Role = "SUPER_ADMIN" | "ADMIN" | "TECH" | "STUDENT";

export const roleHierarchy: Record<Role, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  TECH: 2,
  STUDENT: 1
};

export const hasRole = (userRole: Role, allowed: Role[]) =>
  allowed.includes(userRole);

export const hasMinRole = (userRole: Role, minRole: Role) =>
  roleHierarchy[userRole] >= roleHierarchy[minRole];