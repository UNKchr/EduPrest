import { Response } from "express";
import { getAdminSummary, getDashboardMetrics, getOrgAnalytics, getSummaryReport } from "../services/reports.service";
import type { AuthRequest } from "../middlewares/auth";
import { ApiError } from "../middlewares/errorHandler";

export const getSummary = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const summary = await getSummaryReport(req.user.orgId);
  res.json(summary);
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const metrics = await getDashboardMetrics(req.user.orgId);
  res.json(metrics);
};

export const getAdminSummaryHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const summary = await getAdminSummary(req.user.orgId);
  res.json(summary);
};

export const getAnalyticsHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const orgId = req.user.role === "SUPER_ADMIN" ? null : req.user.orgId;
  const analytics = await getOrgAnalytics(orgId);
  res.json(analytics);
};