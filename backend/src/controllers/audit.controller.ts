import { Response } from "express";
import { z } from "zod";
import { listAuditLogs } from "../services/audit.service";
import type { AuthRequest } from "../middlewares/auth";
import { ApiError } from "../middlewares/errorHandler";

const querySchema = z.object({
  entity: z.string().optional(),
  userId: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(200).optional(),
  offset: z.coerce.number().min(0).optional()
});

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const query = querySchema.parse(req.query);
  const logs = await listAuditLogs({ ...query, organizationId: req.user.orgId });
  res.json(logs);
};