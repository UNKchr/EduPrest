import { Response } from "express";
import { z } from "zod";
import {
  createOrganization,
  listOrganizations,
  banOrganization,
  unbanOrganization,
  getOrganizationById,
  deleteOrganization
} from "../services/organizations.service";
import type { AuthRequest } from "../middlewares/auth";
import { ApiError } from "../middlewares/errorHandler";
import { logAction } from "../services/audit.service";
import { safeAuditLog } from "../utils/audit";

const createSchema = z.object({
  name: z.string().min(3),
  nit: z.string().min(3)
});

const banSchema = z.object({
  reason: z.string().min(5)
});

const deleteSchema = z.object({
  confirm: z.string().min(1)
});

const CONFIRM_TEXT = "CONFIRMAR";

export const createOrg = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const data = createSchema.parse(req.body);
  const org = await createOrganization(data.name, data.nit);
  await logAction("ORG_CREATED", req.user.id, "Organization", org.id, org.id);
  res.status(201).json(org);
};

export const listOrgs = async (_req: AuthRequest, res: Response) => {
  const orgs = await listOrganizations();
  res.json(orgs);
};

export const banOrg = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("ORG_BAN_INVALID_ID", req.user.id, "Organization", 0, req.user.orgId);
    throw new ApiError("Invalid organization id", 400);
  }
  let reason: string;
  try {
    ({ reason } = banSchema.parse(req.body));
  } catch {
    await safeAuditLog("ORG_BAN_INVALID_REASON", req.user.id, "Organization", id, req.user.orgId);
    throw new ApiError("Invalid ban reason", 400);
  }
  const org = await banOrganization(id, reason);
  await logAction("ORG_BANNED", req.user.id, "Organization", org.id, org.id);
  res.json(org);
};

export const unbanOrg = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("ORG_UNBAN_INVALID_ID", req.user.id, "Organization", 0, req.user.orgId);
    throw new ApiError("Invalid organization id", 400);
  }
  const org = await unbanOrganization(id);
  await logAction("ORG_UNBANNED", req.user.id, "Organization", org.id, org.id);
  res.json(org);
};

export const deleteOrg = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("ORG_DELETE_INVALID_ID", req.user.id, "Organization", 0, req.user.orgId);
    throw new ApiError("Invalid organization id", 400);
  }

  let confirm: string;
  try {
    ({ confirm } = deleteSchema.parse(req.body));
  } catch {
    await safeAuditLog("ORG_DELETE_INVALID", req.user.id, "Organization", id, req.user.orgId);
    throw new ApiError("Invalid delete request", 400);
  }

  if (confirm.trim().toUpperCase() !== CONFIRM_TEXT) {
    await safeAuditLog("ORG_DELETE_CONFIRM_INVALID", req.user.id, "Organization", id, req.user.orgId);
    throw new ApiError("Confirmation required", 400);
  }

  const org = await getOrganizationById(id);
  await logAction("ORG_DELETED", req.user.id, "Organization", org.id, org.id);
  await deleteOrganization(id);
  res.json({ message: "Organization deleted" });
};