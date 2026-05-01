import { Request, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middlewares/auth";
import { createReport, listReports, updateReportStatus } from "../services/userReports.service";

const createSchema = z.object({
  userId: z.number().int(),
  reason: z.string().min(5)
});

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"])
});

export const createReportHandler = async (req: AuthRequest, res: Response) => {
  const data = createSchema.parse(req.body);
  const report = await createReport(data.userId, req.user!.id, req.user!.orgId, data.reason);
  res.status(201).json(report);
};

export const listReportsHandler = async (req: AuthRequest, res: Response) => {
  const status = req.query.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
  const reports = await listReports(req.user!.orgId, status);
  res.json(reports);
};

export const updateReportHandler = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { status } = updateSchema.parse(req.body);
  const report = await updateReportStatus(id, status, req.user!.orgId);
  res.json(report);
};