import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

type ItemInput = {
  name: string;
  code: string;
  description?: string;
  quantity?: number;
  isActive?: boolean;
};

export const listItems = (organizationId: number) => {
  return prisma.item.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
};

export const getItemById = async (id: number, organizationId: number) => {
  const item = await prisma.item.findFirst({ where: { id, organizationId } });
  if (!item) throw new ApiError("Item not found", 404);
  return item;
};

export const createItem = (data: ItemInput, organizationId: number) => {
  return prisma.item.create({ data: { ...data, organizationId } });
};

export const updateItem = async (
  id: number,
  data: Partial<ItemInput>,
  organizationId: number
) => {
  await getItemById(id, organizationId);
  return prisma.item.update({ where: { id }, data });
};

export const deleteItem = async (id: number, organizationId: number) => {
  await getItemById(id, organizationId);
  return prisma.item.delete({ where: { id } });
};