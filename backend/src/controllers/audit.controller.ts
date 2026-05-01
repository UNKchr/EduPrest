import { Request, Response } from "express";
import { z } from "zod";
import { listAuditLogs } from "../services/audit.service";

const querySchema = z.object({
  entity: z.string().optional(),
  userId: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(200).optional(),
  offset: z.coerce.number().min(0).optional()
});

export const getAuditLogs = async (req: Request, res: Response) => {
  const query = querySchema.parse(req.query);
  const logs = await listAuditLogs(query);
  res.json(logs);
};