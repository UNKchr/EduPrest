import { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middlewares/auth";
import { createReport, listReports, updateReportStatus } from "../services/userReports.service";
import { ApiError } from "../middlewares/errorHandler";

const createSchema = z.object({
  userId: z.number().int(),
  reason: z.string().min(5)
});

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"])
});

export const createReportHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const data = createSchema.parse(req.body);
  const report = await createReport(data.userId, req.user.id, req.user.orgId, data.reason);
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
  if (!id) throw new ApiError("Invalid report id", 400);
  const { status } = updateSchema.parse(req.body);
  const report = await updateReportStatus(id, status, req.user.orgId);
  res.json(report);
};