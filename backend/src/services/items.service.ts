import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

type ItemInput = {
  name: string;
  code: string;
  description?: string;
  quantity?: number;
  isActive?: boolean;
};

export const listItems = () => {
  return prisma.item.findMany({ orderBy: { createdAt: "desc" } });
};

export const getItemById = async (id: number) => {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) throw new ApiError("Item not found", 404);
  return item;
};

export const createItem = (data: ItemInput) => {
  return prisma.item.create({ data });
};

export const updateItem = async (id: number, data: Partial<ItemInput>) => {
  await getItemById(id);
  return prisma.item.update({ where: { id }, data });
};

export const deleteItem = async (id: number) => {
  await getItemById(id);
  return prisma.item.delete({ where: { id } });
};