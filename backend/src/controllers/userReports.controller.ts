import { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middlewares/auth";
import { createReport, listReports, resolveUserIdByEmail, updateReportStatus } from "../services/userReports.service";
import { ApiError } from "../middlewares/errorHandler";
import { safeAuditLog } from "../utils/audit";

const createSchema = z.object({
  userId: z.number().int().optional(),
  userEmail: z.string().email().optional(),
  reason: z.string().min(5)
}).refine((data) => Boolean(data.userId || data.userEmail), {
  message: "userId or userEmail is required"
});

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"])
});

export const createReportHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  let data: z.infer<typeof createSchema>;
  try {
    data = createSchema.parse(req.body);
  } catch {
    await safeAuditLog("USER_REPORT_CREATE_INVALID", req.user.id, "UserReport", 0, req.user.orgId);
    throw new ApiError("Invalid report data", 400);
  }
  const targetUserId = data.userEmail
    ? await resolveUserIdByEmail(data.userEmail, req.user.orgId)
    : data.userId;

  if (!targetUserId) throw new ApiError("User not found", 404);

  const report = await createReport(targetUserId, req.user.id, req.user.orgId, data.reason);
  res.status(201).json(report);
};

export const listReportsHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const status = req.query.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
  const reports = await listReports(req.user.orgId, status);
  res.json(reports);
};

export const updateReportHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("USER_REPORT_INVALID_ID", req.user.id, "UserReport", 0, req.user.orgId);
    throw new ApiError("Invalid report id", 400);
  }
  let status: z.infer<typeof updateSchema>["status"];
  try {
    ({ status } = updateSchema.parse(req.body));
  } catch {
    await safeAuditLog("USER_REPORT_STATUS_INVALID", req.user.id, "UserReport", id, req.user.orgId);
    throw new ApiError("Invalid report status", 400);
  }
  const report = await updateReportStatus(id, status, req.user.orgId);
  res.json(report);
};