import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";
import { safeAuditLog } from "../utils/audit";
import type { Role } from "../utils/roles";

export type BanRequestActor = {
  id: number;
  role: Role;
  orgId?: number;
};

const includeRequest = {
  organization: { select: { id: true, name: true, nit: true } },
  requestedBy: { select: { id: true, email: true, fullName: true, role: true } },
  targetUser: { select: { id: true, email: true, fullName: true, role: true, status: true } },
  decidedBy: { select: { id: true, email: true, fullName: true, role: true } }
};

const logGuard = async (
  action: string,
  actorId: number,
  targetUserId: number,
  organizationId: number
) => {
  await safeAuditLog(action, actorId, "User", targetUserId, organizationId);
};

export const createBanRequest = async (
  targetUserId: number,
  reason: string,
  actor: BanRequestActor
) => {
  if (actor.role !== "ADMIN") {
    if (actor.orgId) {
      await logGuard("BAN_REQUEST_FORBIDDEN", actor.id, targetUserId, actor.orgId);
    }
    throw new ApiError("Forbidden", 403);
  }
  if (!actor.orgId) throw new ApiError("Organization required", 400);
  if (actor.id === targetUserId) {
    await logGuard("BAN_REQUEST_SELF_FORBIDDEN", actor.id, targetUserId, actor.orgId);
    throw new ApiError("You cannot request a ban for yourself", 403);
  }

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, organizationId: actor.orgId }
  });
  if (!target) {
    await logGuard("BAN_REQUEST_TARGET_NOT_FOUND", actor.id, targetUserId, actor.orgId);
    throw new ApiError("User not found", 404);
  }
  if (target.role !== "ADMIN") {
    await logGuard("BAN_REQUEST_INVALID_TARGET", actor.id, targetUserId, actor.orgId);
    throw new ApiError("Only admin users require a ban request", 400);
  }
  if (target.status === "BANNED") {
    await logGuard("BAN_REQUEST_ALREADY_BANNED", actor.id, targetUserId, actor.orgId);
    throw new ApiError("User already banned", 409);
  }

  const existing = await prisma.adminBanRequest.findFirst({
    where: {
      organizationId: actor.orgId,
      targetUserId,
      status: "PENDING"
    }
  });
  if (existing) {
    await logGuard("BAN_REQUEST_DUPLICATE", actor.id, targetUserId, actor.orgId);
    throw new ApiError("A pending request already exists", 409);
  }

  return prisma.adminBanRequest.create({
    data: {
      organizationId: actor.orgId,
      requestedById: actor.id,
      targetUserId,
      reason
    },
    include: includeRequest
  });
};

export const listBanRequests = async (
  filters: {
    status?: "PENDING" | "APPROVED" | "REJECTED";
    organizationId?: number;
    limit?: number;
    offset?: number;
  },
  actor: BanRequestActor
) => {
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const status = filters.status || undefined;

  const orgFilter = actor.role === "SUPER_ADMIN" ? filters.organizationId : actor.orgId;
  const where = {
    status,
    ...(orgFilter ? { organizationId: orgFilter } : {})
  };

  const [data, total] = await prisma.$transaction([
    prisma.adminBanRequest.findMany({
      where,
      include: includeRequest,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      skip: offset
    }),
    prisma.adminBanRequest.count({ where })
  ]);

  return { data, total };
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

export const approveBanRequest = async (
  id: number,
  decisionNote: string | undefined,
  actor: BanRequestActor
) => {
  if (actor.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403);
  }

  const request = await prisma.adminBanRequest.findUnique({
    where: { id },
    include: includeRequest
  });
  if (!request) throw new ApiError("Request not found", 404);
  if (request.status !== "PENDING") {
    throw new ApiError("Request already processed", 409);
  }
  if (request.targetUser.role !== "ADMIN") {
    throw new ApiError("Only admin targets can be approved", 409);
  }
  if (request.targetUser.status === "BANNED") {
    throw new ApiError("User already banned", 409);
  }

  await ensureNotLastAdmin(request.organizationId, request.targetUserId);

  const decidedAt = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: request.targetUserId },
      data: { status: "BANNED", bannedAt: decidedAt, banReason: request.reason }
    }),
    prisma.adminBanRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        decidedAt,
        decidedById: actor.id,
        decisionNote: decisionNote || null
      }
    })
  ]);

  return prisma.adminBanRequest.findUnique({
    where: { id: request.id },
    include: includeRequest
  });
};

export const rejectBanRequest = async (
  id: number,
  decisionNote: string | undefined,
  actor: BanRequestActor
) => {
  if (actor.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403);
  }

  const request = await prisma.adminBanRequest.findUnique({
    where: { id },
    include: includeRequest
  });
  if (!request) throw new ApiError("Request not found", 404);
  if (request.status !== "PENDING") {
    throw new ApiError("Request already processed", 409);
  }

  const decidedAt = new Date();

  return prisma.adminBanRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      decidedAt,
      decidedById: actor.id,
      decisionNote: decisionNote || null
    },
    include: includeRequest
  });
};
