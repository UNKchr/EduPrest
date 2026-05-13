import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

export const createReport = async (userId: number, reportedById: number, orgId: number, reason: string) => {
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId: orgId } });
  if (!user) throw new ApiError("User not found", 404);

  const reporter = await prisma.user.findFirst({ where: { id: reportedById, organizationId: orgId } });
  if (!reporter) throw new ApiError("Reporter not found", 404);

  return prisma.userReport.create({
    data: { userId, reportedById, organizationId: orgId, reason }
  });
};

export const resolveUserIdByEmail = async (email: string, orgId: number) => {
  const user = await prisma.user.findFirst({
    where: {
      organizationId: orgId,
      email: { equals: email, mode: "insensitive" }
    }
  });
  if (!user) throw new ApiError("User not found", 404);
  return user.id;
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