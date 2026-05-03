import { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middlewares/auth";
import { createUserByAdmin, listUsers, updateUserRole, banUser, unbanUser } from "../services/users.service";
import { ApiError } from "../middlewares/errorHandler";
import { logAction } from "../services/audit.service";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(3),
  role: z.enum(["ADMIN", "TECH", "STUDENT"]),
  organizationId: z.number().int().optional()
});

const roleSchema = z.object({
  role: z.enum(["ADMIN", "TECH", "STUDENT"])
});

const banSchema = z.object({
  reason: z.string().min(5)
});

export const getUsers = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const isSuper = req.user?.role === "SUPER_ADMIN";
  const users = await listUsers(isSuper ? undefined : req.user?.orgId);
  res.json(users);
};

export const createUserHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const data = createSchema.parse(req.body);
  const isSuper = req.user?.role === "SUPER_ADMIN";

  const orgId = isSuper ? data.organizationId : req.user?.orgId;
  if (!orgId) throw new ApiError("Organization required", 400);

  const user = await createUserByAdmin(data.email, data.password, data.fullName, data.role, orgId);
  await logAction("USER_CREATED", req.user.id, "User", user.id, orgId);
  res.status(201).json(user);
};

export const updateRoleHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid user id", 400);
  const { role } = roleSchema.parse(req.body);

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
  if (!id) throw new ApiError("Invalid user id", 400);
  const { reason } = banSchema.parse(req.body);

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
  if (!id) throw new ApiError("Invalid user id", 400);

  const isSuper = req.user?.role === "SUPER_ADMIN";
  const user = await unbanUser(id, {
    id: req.user.id,
    role: req.user.role,
    orgId: isSuper ? undefined : req.user.orgId
  });
  await logAction("USER_UNBANNED", req.user.id, "User", user.id, user.organizationId);
  res.json(user);
};