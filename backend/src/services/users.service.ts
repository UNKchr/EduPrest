import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";
import type { Role } from "../utils/roles";
import bcrypt from "bcrypt";

export const listUsers = async (orgId?: number) => {
  return prisma.user.findMany({
    where: orgId ? { organizationId: orgId } : undefined,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, fullName: true, role: true, status: true, organizationId: true }
  });
};

export const createUserByAdmin = async (
  email: string,
  password: string,
  fullName: string,
  role: Role,
  organizationId: number
) => {
  const exists = await prisma.user.findFirst({ where: { email, organizationId } });
  if (exists) throw new ApiError("Email already in use", 409);

  const hash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: { email, password: hash, fullName, role, organizationId }
  });
};

export const updateUserRole = async (id: number, role: Role, orgId?: number) => {
  if (orgId) {
    const user = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
    if (!user) throw new ApiError("User not found", 404);
  }
  return prisma.user.update({ where: { id }, data: { role } });
};

export const banUser = async (id: number, reason: string, orgId?: number) => {
  if (orgId) {
    const user = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
    if (!user) throw new ApiError("User not found", 404);
  }
  return prisma.user.update({
    where: { id },
    data: { status: "BANNED", bannedAt: new Date(), banReason: reason }
  });
};

export const unbanUser = async (id: number, orgId?: number) => {
  if (orgId) {
    const user = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
    if (!user) throw new ApiError("User not found", 404);
  }
  return prisma.user.update({
    where: { id },
    data: { status: "ACTIVE", bannedAt: null, banReason: null }
  });
};