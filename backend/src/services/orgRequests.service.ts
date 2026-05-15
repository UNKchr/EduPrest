import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

export const createOrgRequest = async (
  orgName: string,
  orgNit: string,
  requesterName: string,
  requesterEmail: string
) => {
  // Silently skip if the NIT is already registered or has a pending request, to avoid
  // revealing organization existence to anonymous callers.
  const [orgExists, existing] = await Promise.all([
    prisma.organization.findUnique({ where: { nit: orgNit } }),
    prisma.orgRequest.findFirst({ where: { orgNit, status: "PENDING" } })
  ]);
  if (orgExists || existing) return null;

  return prisma.orgRequest.create({
    data: { orgName, orgNit, requesterName, requesterEmail }
  });
};

export const listOrgRequests = async (
  status?: "PENDING" | "APPROVED" | "REJECTED",
  limit = 20,
  offset = 0
) => {
  const where = status ? { status } : {};

  const [data, total] = await Promise.all([
    prisma.orgRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    }),
    prisma.orgRequest.count({ where })
  ]);

  return { data, total };
};

export const approveOrgRequest = async (id: number, decidedById: number) => {
  const request = await prisma.orgRequest.findUnique({ where: { id } });
  if (!request) throw new ApiError("Solicitud no encontrada", 404);
  if (request.status !== "PENDING") throw new ApiError("La solicitud ya fue procesada", 409);

  // Re-check NIT uniqueness at approval time
  const orgExists = await prisma.organization.findUnique({ where: { nit: request.orgNit } });
  if (orgExists) {
    await prisma.orgRequest.update({
      where: { id },
      data: { status: "REJECTED", decidedAt: new Date(), decidedById }
    });
    throw new ApiError("Ya existe una organización con este NIT; solicitud rechazada automáticamente", 409);
  }

  return prisma.$transaction(async (tx) => {
    await tx.organization.create({
      data: { name: request.orgName, nit: request.orgNit }
    });
    return tx.orgRequest.update({
      where: { id },
      data: { status: "APPROVED", decidedAt: new Date(), decidedById }
    });
  });
};

export const rejectOrgRequest = async (id: number, decidedById: number) => {
  const request = await prisma.orgRequest.findUnique({ where: { id } });
  if (!request) throw new ApiError("Solicitud no encontrada", 404);
  if (request.status !== "PENDING") throw new ApiError("La solicitud ya fue procesada", 409);

  return prisma.orgRequest.update({
    where: { id },
    data: { status: "REJECTED", decidedAt: new Date(), decidedById }
  });
};
