import { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../middlewares/errorHandler";
import { createItem, deleteItem, getItemById, listItems, updateItem } from "../services/items.service";
import { logAction } from "../services/audit.service";
import type { AuthRequest } from "../middlewares/auth";

const itemSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  isActive: z.boolean().optional()
});

const itemUpdateSchema = itemSchema.partial();

export const getItems = async (_req: Request, res: Response) => {
  const items = await listItems();
  res.json(items);
};

export const getItem = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid item id", 400);
  const item = await getItemById(id);
  res.json(item);
};

export const createItemHandler = async (req: AuthRequest, res: Response) => {
  const data = itemSchema.parse(req.body);
  const item = await createItem(data);
  await logAction("ITEM_CREATED", req.user?.id, "Item", item.id);
  res.status(201).json(item);
};

export const updateItemHandler = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid item id", 400);
  const data = itemUpdateSchema.parse(req.body);
  const item = await updateItem(id, data);
  await logAction("ITEM_UPDATED", req.user?.id, "Item", item.id);
  res.json(item);
};

export const deleteItemHandler = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid item id", 400);
  const item = await deleteItem(id);
  await logAction("ITEM_DELETED", req.user?.id, "Item", item.id);
  res.json({ message: "Item deleted" });
};