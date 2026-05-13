import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";
import { safeAuditLog } from "../utils/audit";
import type { Role } from "../utils/roles";

type ActorContext = {
  id: number;
  role: Role;
  orgId?: number;
};

type ListUsersParams = {
  orgId?: number;
  q?: string;
  role?: Role;
  limit?: number;
  offset?: number;
};

const loadTargetUser = async (id: number, orgId?: number) => {
  const user = await prisma.user.findFirst({
    where: orgId ? { id, organizationId: orgId } : { id }
  });
  if (!user) throw new ApiError("User not found", 404);
  return user;
};

const logGuard = async (
  action: string,
  actorId: number,
  targetId: number,
  organizationId: number
) => {
  await safeAuditLog(action, actorId, "User", targetId, organizationId);
};

const countRemainingAdmins = (organizationId: number, targetId: number) =>
  prisma.user.count({
    where: {
      organizationId,
      role: "ADMIN",
      status: "ACTIVE",
      id: { not: targetId }
    }
  });

const countRemainingSuperAdmins = (targetId: number) =>
  prisma.user.count({
    where: { role: "SUPER_ADMIN", status: "ACTIVE", id: { not: targetId } }
  });

export const listUsers = async ({ orgId, q, role, limit = 20, offset = 0 }: ListUsersParams) => {
  const where = {
    ...(orgId ? { organizationId: orgId } : {}),
    ...(role ? { role } : {}),
    ...(q
      ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { fullName: { contains: q, mode: "insensitive" } }
        ]
      }
      : {})
  };

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: offset,
      take: limit,
      select: { id: true, email: true, fullName: true, role: true, status: true, organizationId: true }
    }),
    prisma.user.count({ where })
  ]);

  return { data, total };
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
  if (target.id === actor.id) {
    await logGuard("USER_ROLE_SELF_FORBIDDEN", actor.id, target.id, target.organizationId);
    throw new ApiError("You cannot change your own role", 403);
  }

  if (actor.role === "ADMIN" && target.role === "ADMIN") {
    await logGuard("USER_ROLE_FORBIDDEN", actor.id, target.id, target.organizationId);
    throw new ApiError("Admins cannot change roles of other admins", 403);
  }

  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    await logGuard("USER_ROLE_FORBIDDEN_SUPER_ADMIN", actor.id, target.id, target.organizationId);
    throw new ApiError("Forbidden", 403);
  }

  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const remaining = await countRemainingSuperAdmins(target.id);
    if (remaining === 0) {
      await logGuard("USER_ROLE_BLOCKED_LAST_SUPER_ADMIN", actor.id, target.id, target.organizationId);
      throw new ApiError("At least one active super admin is required", 409);
    }
  }

  if (target.role === "ADMIN" && role !== "ADMIN") {
    const remaining = await countRemainingAdmins(target.organizationId, target.id);
    if (remaining === 0) {
      await logGuard("USER_ROLE_BLOCKED_LAST_ADMIN", actor.id, target.id, target.organizationId);
      throw new ApiError("At least one active admin is required", 409);
    }
  }

  return prisma.user.update({ where: { id: target.id }, data: { role } });
};

export const banUser = async (id: number, reason: string, actor: ActorContext) => {
  const target = await loadTargetUser(id, actor.orgId);
  if (target.id === actor.id) {
    await logGuard("USER_BAN_SELF_FORBIDDEN", actor.id, target.id, target.organizationId);
    throw new ApiError("You cannot ban your own user", 403);
  }

  if (actor.role === "ADMIN" && target.role === "ADMIN") {
    await logGuard("USER_BAN_FORBIDDEN", actor.id, target.id, target.organizationId);
    throw new ApiError("Admins cannot ban other admins", 403);
  }

  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    await logGuard("USER_BAN_FORBIDDEN_SUPER_ADMIN", actor.id, target.id, target.organizationId);
    throw new ApiError("Forbidden", 403);
  }

  if (target.role === "SUPER_ADMIN" && target.status === "ACTIVE") {
    const remaining = await countRemainingSuperAdmins(target.id);
    if (remaining === 0) {
      await logGuard("USER_BAN_BLOCKED_LAST_SUPER_ADMIN", actor.id, target.id, target.organizationId);
      throw new ApiError("At least one active super admin is required", 409);
    }
  }

  if (target.role === "ADMIN" && target.status === "ACTIVE") {
    const remaining = await countRemainingAdmins(target.organizationId, target.id);
    if (remaining === 0) {
      await logGuard("USER_BAN_BLOCKED_LAST_ADMIN", actor.id, target.id, target.organizationId);
      throw new ApiError("At least one active admin is required", 409);
    }
  }

  return prisma.user.update({
    where: { id: target.id },
    data: { status: "BANNED", bannedAt: new Date(), banReason: reason }
  });
};

export const unbanUser = async (id: number, actor: ActorContext) => {
  const target = await loadTargetUser(id, actor.orgId);

  if (target.id === actor.id) {
    await logGuard("USER_UNBAN_SELF_FORBIDDEN", actor.id, target.id, target.organizationId);
    throw new ApiError("You cannot unban your own user", 403);
  }

  if (actor.role === "ADMIN" && target.role === "ADMIN") {
    await logGuard("USER_UNBAN_FORBIDDEN", actor.id, target.id, target.organizationId);
    throw new ApiError("Admins cannot unban other admins", 403);
  }

  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    await logGuard("USER_UNBAN_FORBIDDEN_SUPER_ADMIN", actor.id, target.id, target.organizationId);
    throw new ApiError("Forbidden", 403);
  }

  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403);
  }

  return prisma.user.update({
    where: { id: target.id },
    data: { status: "ACTIVE", bannedAt: null, banReason: null }
  });
};

export const deleteUser = async (id: number, actor: ActorContext) => {
  const target = await loadTargetUser(id, actor.orgId);

  if (target.id === actor.id) {
    await logGuard("USER_DELETE_SELF_FORBIDDEN", actor.id, target.id, target.organizationId);
    throw new ApiError("You cannot delete your own user", 403);
  }

  if (actor.role === "ADMIN" && (target.role === "ADMIN" || target.role === "SUPER_ADMIN")) {
    await logGuard("USER_DELETE_FORBIDDEN", actor.id, target.id, target.organizationId);
    throw new ApiError("Admins cannot delete other admins", 403);
  }

  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    await logGuard("USER_DELETE_FORBIDDEN_SUPER_ADMIN", actor.id, target.id, target.organizationId);
    throw new ApiError("Forbidden", 403);
  }

  if (target.role === "SUPER_ADMIN") {
    const remaining = await countRemainingSuperAdmins(target.id);
    if (remaining === 0) {
      await logGuard("USER_DELETE_BLOCKED_LAST_SUPER_ADMIN", actor.id, target.id, target.organizationId);
      throw new ApiError("At least one active super admin is required", 409);
    }
  }

  if (target.role === "ADMIN") {
    const remaining = await countRemainingAdmins(target.organizationId, target.id);
    if (remaining === 0) {
      await logGuard("USER_DELETE_BLOCKED_LAST_ADMIN", actor.id, target.id, target.organizationId);
      throw new ApiError("At least one active admin is required", 409);
    }
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.adminBanRequest.deleteMany({
      where: {
        OR: [{ requestedById: target.id }, { targetUserId: target.id }, { decidedById: target.id }]
      }
    });
    await tx.userReport.deleteMany({
      where: { OR: [{ userId: target.id }, { reportedById: target.id }] }
    });
    await tx.loan.deleteMany({ where: { userId: target.id } });
    await tx.auditLog.deleteMany({ where: { userId: target.id } });
    return tx.user.delete({ where: { id: target.id } });
  });

  return deleted;
};