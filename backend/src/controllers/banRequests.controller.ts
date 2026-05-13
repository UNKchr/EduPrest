import { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middlewares/auth";
import { ApiError } from "../middlewares/errorHandler";
import { logAction } from "../services/audit.service";
import { safeAuditLog } from "../utils/audit";
import {
  approveBanRequest,
  createBanRequest,
  listBanRequests,
  rejectBanRequest
} from "../services/banRequests.service";

const createSchema = z.object({
  targetUserId: z.number().int(),
  reason: z.string().min(10)
});

const listSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  organizationId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const decisionSchema = z.object({
  decisionNote: z.string().min(5).optional()
});

export const createRequestHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  let data: z.infer<typeof createSchema>;
  try {
    data = createSchema.parse(req.body);
  } catch {
    await safeAuditLog("BAN_REQUEST_INVALID", req.user.id, "AdminBanRequest", 0, req.user.orgId);
    throw new ApiError("Invalid ban request", 400);
  }

  const request = await createBanRequest(data.targetUserId, data.reason, {
    id: req.user.id,
    role: req.user.role,
    orgId: req.user.orgId
  });

  const orgId = request.organization?.id ?? request.organizationId;
  await logAction("BAN_REQUEST_CREATED", req.user.id, "AdminBanRequest", request.id, orgId);

  res.status(201).json(request);
};

export const listRequestsHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  let query: z.infer<typeof listSchema>;
  try {
    query = listSchema.parse(req.query);
  } catch {
    await safeAuditLog("BAN_REQUEST_LIST_INVALID", req.user.id, "AdminBanRequest", 0, req.user.orgId);
    throw new ApiError("Invalid request filters", 400);
  }

  const result = await listBanRequests(
    {
      status: query.status,
      organizationId: query.organizationId,
      limit: query.limit,
      offset: query.offset
    },
    {
      id: req.user.id,
      role: req.user.role,
      orgId: req.user.role === "SUPER_ADMIN" ? undefined : req.user.orgId
    }
  );

  res.json(result);
};

export const approveRequestHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("BAN_REQUEST_INVALID_ID", req.user.id, "AdminBanRequest", 0, req.user.orgId);
    throw new ApiError("Invalid request id", 400);
  }
  let data: z.infer<typeof decisionSchema>;
  try {
    data = decisionSchema.parse(req.body || {});
  } catch {
    await safeAuditLog("BAN_REQUEST_DECISION_INVALID", req.user.id, "AdminBanRequest", id, req.user.orgId);
    throw new ApiError("Invalid decision data", 400);
  }

  const request = await approveBanRequest(id, data.decisionNote, {
    id: req.user.id,
    role: req.user.role
  });

  if (!request) {
    throw new ApiError("Request not found", 404);
  }

  const orgId = request?.organization?.id ?? request?.organizationId;
  if (orgId) {
    await logAction("BAN_REQUEST_APPROVED", req.user.id, "AdminBanRequest", request.id, orgId);
    if (request?.targetUser?.id) {
      await logAction("USER_BANNED", req.user.id, "User", request.targetUser.id, orgId);
    }
  }

  res.json(request);
};

export const rejectRequestHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("BAN_REQUEST_INVALID_ID", req.user.id, "AdminBanRequest", 0, req.user.orgId);
    throw new ApiError("Invalid request id", 400);
  }
  let data: z.infer<typeof decisionSchema>;
  try {
    data = decisionSchema.parse(req.body || {});
  } catch {
    await safeAuditLog("BAN_REQUEST_DECISION_INVALID", req.user.id, "AdminBanRequest", id, req.user.orgId);
    throw new ApiError("Invalid decision data", 400);
  }

  const request = await rejectBanRequest(id, data.decisionNote, {
    id: req.user.id,
    role: req.user.role
  });

  if (!request) {
    throw new ApiError("Request not found", 404);
  }

  const orgId = request?.organization?.id ?? request?.organizationId;
  if (orgId) {
    await logAction("BAN_REQUEST_REJECTED", req.user.id, "AdminBanRequest", request.id, orgId);
  }

  res.json(request);
};
