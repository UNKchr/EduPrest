import { Response } from "express";
import { z } from "zod";
import { ApiError } from "../middlewares/errorHandler";
import { createItem, deleteItem, getItemById, listItems, updateItem } from "../services/items.service";
import { logAction } from "../services/audit.service";
import type { AuthRequest } from "../middlewares/auth";
import { safeAuditLog } from "../utils/audit";

const itemSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  isActive: z.boolean().optional()
});

const itemUpdateSchema = itemSchema.partial();

export const getItems = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const items = await listItems(req.user.orgId);
  res.json(items);
};

export const getItem = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("ITEM_INVALID_ID_GET", req.user.id, "Item", 0, req.user.orgId);
    throw new ApiError("Invalid item id", 400);
  }
  const item = await getItemById(id, req.user.orgId);
  res.json(item);
};

export const createItemHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  let data: z.infer<typeof itemSchema>;
  try {
    data = itemSchema.parse(req.body);
  } catch {
    await safeAuditLog("ITEM_CREATE_INVALID", req.user.id, "Item", 0, req.user.orgId);
    throw new ApiError("Invalid item data", 400);
  }
  const item = await createItem(data, req.user.orgId);
  await logAction("ITEM_CREATED", req.user.id, "Item", item.id, req.user.orgId);
  res.status(201).json(item);
};

export const updateItemHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("ITEM_INVALID_ID_UPDATE", req.user.id, "Item", 0, req.user.orgId);
    throw new ApiError("Invalid item id", 400);
  }
  let data: z.infer<typeof itemUpdateSchema>;
  try {
    data = itemUpdateSchema.parse(req.body);
  } catch {
    await safeAuditLog("ITEM_UPDATE_INVALID", req.user.id, "Item", id, req.user.orgId);
    throw new ApiError("Invalid item data", 400);
  }
  const item = await updateItem(id, data, req.user.orgId);
  await logAction("ITEM_UPDATED", req.user.id, "Item", item.id, req.user.orgId);
  res.json(item);
};

export const deleteItemHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) {
    await safeAuditLog("ITEM_INVALID_ID_DELETE", req.user.id, "Item", 0, req.user.orgId);
    throw new ApiError("Invalid item id", 400);
  }
  const item = await deleteItem(id, req.user.orgId);
  await logAction("ITEM_DELETED", req.user.id, "Item", item.id, req.user.orgId);
  res.json({ message: "Item deleted" });
};