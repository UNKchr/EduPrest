import { Response } from "express";
import { z } from "zod";
import { listAuditLogs } from "../services/audit.service";
import type { AuthRequest } from "../middlewares/auth";
import { ApiError } from "../middlewares/errorHandler";

const ALLOWED_ENTITIES = [
  "User",
  "Item",
  "Loan",
  "Organization",
  "AdminBanRequest",
  "UserReport",
  "AccessRequest",
  "OrgRequest",
  "Security"
] as const;

const querySchema = z.object({
  entity: z.enum(ALLOWED_ENTITIES).optional(),
  userId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  let query: z.infer<typeof querySchema>;
  try {
    query = querySchema.parse(req.query);
  } catch {
    throw new ApiError("Invalid query", 400);
  }
  const logs = await listAuditLogs({ ...query, organizationId: req.user.orgId });
  res.json(logs);
};