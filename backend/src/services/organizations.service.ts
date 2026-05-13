import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

export const createOrganization = async (name: string, nit: string) => {
  const exists = await prisma.organization.findUnique({ where: { nit } });
  if (exists) throw new ApiError("Organization already exists", 409);

  return prisma.organization.create({ data: { name, nit } });
};

export const listOrganizations = () => {
  return prisma.organization.findMany({ orderBy: { createdAt: "desc" } });
};

export const getOrganizationById = async (id: number) => {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new ApiError("Organization not found", 404);
  return org;
};

export const banOrganization = async (id: number, reason: string) => {
  return prisma.organization.update({
    where: { id },
    data: { status: "BANNED", bannedAt: new Date(), banReason: reason }
  });
};

export const unbanOrganization = async (id: number) => {
  return prisma.organization.update({
    where: { id },
    data: { status: "ACTIVE", bannedAt: null, banReason: null }
  });
};

export const deleteOrganization = async (id: number) => {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new ApiError("Organization not found", 404);

  await prisma.$transaction(async (tx) => {
    await tx.adminBanRequest.deleteMany({ where: { organizationId: id } });
    await tx.userReport.deleteMany({ where: { organizationId: id } });
    await tx.loan.deleteMany({ where: { organizationId: id } });
    await tx.auditLog.deleteMany({ where: { organizationId: id } });
    await tx.item.deleteMany({ where: { organizationId: id } });
    await tx.user.deleteMany({ where: { organizationId: id } });
    await tx.organization.delete({ where: { id } });
  });

  return org;
};