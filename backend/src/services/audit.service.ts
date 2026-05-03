import { prisma } from "../config/prisma";

export const logAction = async (
  action: string,
  userId: number | undefined,
  entity: string,
  entityId: number,
  organizationId: number
) => {
  await prisma.auditLog.create({
    data: {
      action,
      userId: userId ?? null,
      entity,
      entityId,
      organizationId
    }
  });
};

export const listAuditLogs = (query: {
  entity?: string;
  userId?: number;
  organizationId: number;
  limit?: number;
  offset?: number;
}) => {
  const { entity, userId, organizationId, limit = 50, offset = 0 } = query;

  return prisma.auditLog.findMany({
    where: {
      organizationId,
      entity: entity || undefined,
      userId: userId || undefined
    },
    include: {
      user: { select: { id: true, email: true, fullName: true, role: true } }
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset
  });
};