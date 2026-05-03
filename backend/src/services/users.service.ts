import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";
import type { Role } from "../utils/roles";

type ActorContext = {
  id: number;
  role: Role;
  orgId?: number;
};

const loadTargetUser = async (id: number, orgId?: number) => {
  const user = await prisma.user.findFirst({
    where: orgId ? { id, organizationId: orgId } : { id }
  });
  if (!user) throw new ApiError("User not found", 404);
  return user;
};

const ensureNotSelf = (targetId: number, actorId: number, action: string) => {
  if (targetId === actorId) {
    throw new ApiError(`You cannot ${action} your own user`, 403);
  }
};

const ensureNotLastAdmin = async (organizationId: number, targetId: number) => {
  const remaining = await prisma.user.count({
    where: {
      organizationId,
      role: "ADMIN",
      status: "ACTIVE",
      id: { not: targetId }
    }
  });
  if (remaining === 0) {
    throw new ApiError("At least one active admin is required", 409);
  }
};

const ensureNotLastSuperAdmin = async (targetId: number) => {
  const remaining = await prisma.user.count({
    where: { role: "SUPER_ADMIN", status: "ACTIVE", id: { not: targetId } }
  });
  if (remaining === 0) {
    throw new ApiError("At least one active super admin is required", 409);
  }
};

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

export const updateUserRole = async (id: number, role: Role, actor: ActorContext) => {
  const target = await loadTargetUser(id, actor.orgId);
  ensureNotSelf(target.id, actor.id, "change the role of");

  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403);
  }

  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    await ensureNotLastSuperAdmin(target.id);
  }

  if (target.role === "ADMIN" && role !== "ADMIN") {
    await ensureNotLastAdmin(target.organizationId, target.id);
  }

  return prisma.user.update({ where: { id: target.id }, data: { role } });
};

export const banUser = async (id: number, reason: string, actor: ActorContext) => {
  const target = await loadTargetUser(id, actor.orgId);
  ensureNotSelf(target.id, actor.id, "ban");

  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403);
  }

  if (target.role === "SUPER_ADMIN" && target.status === "ACTIVE") {
    await ensureNotLastSuperAdmin(target.id);
  }

  if (target.role === "ADMIN" && target.status === "ACTIVE") {
    await ensureNotLastAdmin(target.organizationId, target.id);
  }

  return prisma.user.update({
    where: { id: target.id },
    data: { status: "BANNED", bannedAt: new Date(), banReason: reason }
  });
};

export const unbanUser = async (id: number, actor: ActorContext) => {
  const target = await loadTargetUser(id, actor.orgId);

  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403);
  }

  return prisma.user.update({
    where: { id: target.id },
    data: { status: "ACTIVE", bannedAt: null, banReason: null }
  });
};