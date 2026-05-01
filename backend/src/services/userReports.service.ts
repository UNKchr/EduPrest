import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

export const createReport = async (userId: number, reportedById: number, orgId: number, reason: string) => {
  return prisma.userReport.create({
    data: { userId, reportedById, organizationId: orgId, reason }
  });
};

export const listReports = async (orgId: number, status?: "PENDING" | "APPROVED" | "REJECTED") => {
  return prisma.userReport.findMany({
    where: { organizationId: orgId, status: status || undefined },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      reportedBy: { select: { id: true, email: true, fullName: true } }
    },
    orderBy: { createdAt: "desc" }
  });
};

export const updateReportStatus = async (id: number, status: "APPROVED" | "REJECTED", orgId: number) => {
  const report = await prisma.userReport.findFirst({ where: { id, organizationId: orgId } });
  if (!report) throw new ApiError("Report not found", 404);

  return prisma.userReport.update({
    where: { id },
    data: { status }
  });
};