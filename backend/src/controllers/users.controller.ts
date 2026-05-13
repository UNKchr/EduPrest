import { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middlewares/auth";
import {
  createUserByAdmin,
  listUsers,
  updateUserRole,
  banUser,
  unbanUser,
  deleteUser
} from "../services/users.service";
import { ApiError } from "../middlewares/errorHandler";
import { logAction } from "../services/audit.service";
import { safeAuditLog } from "../utils/audit";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(3),
  role: z.enum(["ADMIN", "TECH", "STUDENT"]),
  organizationId: z.number().int().optional()
});

const roleSchema = z.object({
  role: z.enum(["ADMIN", "TECH", "STUDENT"]),
  reason: z.string().min(10),
  confirm: z.string().min(1)
});

const banSchema = z.object({
  reason: z.string().min(5),
  confirm: z.string().min(1)
});

const unbanSchema = z.object({
  reason: z.string().min(10),
  confirm: z.string().min(1)
});

const deleteSchema = z.object({
  confirm: z.string().min(1)
});

const CONFIRM_TEXT = "CONFIRMAR";

const listSchema = z.object({
  q: z.string().min(1).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TECH", "STUDENT"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const getUsers = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const isSuper = req.user?.role === "SUPER_ADMIN";
  let params: z.infer<typeof listSchema>;
  try {
    params = listSchema.parse({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      role: typeof req.query.role === "string" ? req.query.role : undefined,
      limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
      offset: typeof req.query.offset === "string" ? req.query.offset : undefined
    });
  } catch {
    await safeAuditLog("USER_LIST_INVALID_QUERY", req.user.id, "User", 0, req.user.orgId);
    throw new ApiError("Invalid query", 400);
  }

  const { data, total } = await listUsers({
    orgId: isSuper ? undefined : req.user?.orgId,
    ...params
  });
  res.json({ data, total });
};

export const createUserHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  let data: z.infer<typeof createSchema>;
  try {
    data = createSchema.parse(req.body);
  } catch {
    await safeAuditLog("USER_CREATE_INVALID", req.user.id, "User", 0, req.user.orgId);
    throw new ApiError("Invalid user data", 400);
  }
  const isSuper = req.user?.role === "SUPER_ADMIN";

  const orgId = isSuper ? data.organizationId : req.user?.orgId;
  if (!orgId) {
    await safeAuditLog("USER_CREATE_MISSING_ORG", req.user.id, "User", 0, req.user.orgId);
    throw new ApiError("Organization required", 400);
  }

  const user = await createUserByAdmin(data.email, data.password, data.fullName, data.role, orgId);
  await logAction("USER_CREATED", req.user.id, "User", user.id, orgId);
  res.status(201).json(user);
};

export const updateRoleHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("USER_INVALID_ID_ROLE", req.user.id, "User", 0, req.user.orgId);
    throw new ApiError("Invalid user id", 400);
  }
  let role: z.infer<typeof roleSchema>["role"];
  let confirm: string;
  try {
    ({ role, confirm } = roleSchema.parse(req.body));
  } catch {
    await safeAuditLog("USER_ROLE_INVALID", req.user.id, "User", id, req.user.orgId);
    throw new ApiError("Invalid role", 400);
  }

  if (confirm.trim().toUpperCase() !== CONFIRM_TEXT) {
    await safeAuditLog("USER_ROLE_CONFIRM_INVALID", req.user.id, "User", id, req.user.orgId);
    throw new ApiError("Confirmation required", 400);
  }

  const isSuper = req.user?.role === "SUPER_ADMIN";
  const user = await updateUserRole(id, role, {
    id: req.user.id,
    role: req.user.role,
    orgId: isSuper ? undefined : req.user.orgId
  });
  await logAction("USER_ROLE_UPDATED", req.user.id, "User", user.id, user.organizationId);
  res.json(user);
};

export const banUserHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("USER_INVALID_ID_BAN", req.user.id, "User", 0, req.user.orgId);
    throw new ApiError("Invalid user id", 400);
  }
  let reason: z.infer<typeof banSchema>["reason"];
  let confirm: string;
  try {
    ({ reason, confirm } = banSchema.parse(req.body));
  } catch {
    await safeAuditLog("USER_BAN_INVALID_REASON", req.user.id, "User", id, req.user.orgId);
    throw new ApiError("Invalid ban reason", 400);
  }

  if (confirm.trim().toUpperCase() !== CONFIRM_TEXT) {
    await safeAuditLog("USER_BAN_CONFIRM_INVALID", req.user.id, "User", id, req.user.orgId);
    throw new ApiError("Confirmation required", 400);
  }

  const isSuper = req.user?.role === "SUPER_ADMIN";
  const user = await banUser(id, reason, {
    id: req.user.id,
    role: req.user.role,
    orgId: isSuper ? undefined : req.user.orgId
  });
  await logAction("USER_BANNED", req.user.id, "User", user.id, user.organizationId);
  res.json(user);
};

export const unbanUserHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("USER_INVALID_ID_UNBAN", req.user.id, "User", 0, req.user.orgId);
    throw new ApiError("Invalid user id", 400);
  }

  let confirm: string;
  try {
    ({ confirm } = unbanSchema.parse(req.body));
  } catch {
    await safeAuditLog("USER_UNBAN_INVALID", req.user.id, "User", id, req.user.orgId);
    throw new ApiError("Invalid unban request", 400);
  }

  if (confirm.trim().toUpperCase() !== CONFIRM_TEXT) {
    await safeAuditLog("USER_UNBAN_CONFIRM_INVALID", req.user.id, "User", id, req.user.orgId);
    throw new ApiError("Confirmation required", 400);
  }

  const isSuper = req.user?.role === "SUPER_ADMIN";
  const user = await unbanUser(id, {
    id: req.user.id,
    role: req.user.role,
    orgId: isSuper ? undefined : req.user.orgId
  });
  await logAction("USER_UNBANNED", req.user.id, "User", user.id, user.organizationId);
  res.json(user);
};

export const deleteUserHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("USER_INVALID_ID_DELETE", req.user.id, "User", 0, req.user.orgId);
    throw new ApiError("Invalid user id", 400);
  }

  let confirm: string;
  try {
    ({ confirm } = deleteSchema.parse(req.body));
  } catch {
    await safeAuditLog("USER_DELETE_INVALID", req.user.id, "User", id, req.user.orgId);
    throw new ApiError("Invalid delete request", 400);
  }

  if (confirm.trim().toUpperCase() !== CONFIRM_TEXT) {
    await safeAuditLog("USER_DELETE_CONFIRM_INVALID", req.user.id, "User", id, req.user.orgId);
    throw new ApiError("Confirmation required", 400);
  }

  const isSuper = req.user?.role === "SUPER_ADMIN";
  const user = await deleteUser(id, {
    id: req.user.id,
    role: req.user.role,
    orgId: isSuper ? undefined : req.user.orgId
  });
  await logAction("USER_DELETED", req.user.id, "User", user.id, user.organizationId);
  res.json({ message: "User deleted" });
};