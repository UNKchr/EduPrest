import { http } from "./http";

export type Item = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  quantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const itemsApi = {
  list: async () => {
    const { data } = await http.get<Item[]>("/items");
    return data;
  },
  get: async (id: number) => {
    const { data } = await http.get<Item>(`/items/${id}`);
    return data;
  },
  create: async (payload: Omit<Item, "id" | "createdAt" | "updatedAt">) => {
    const { data } = await http.post<Item>("/items", payload);
    return data;
  },
  update: async (id: number, payload: Partial<Omit<Item, "id">>) => {
    const { data } = await http.put<Item>(`/items/${id}`, payload);
    return data;
  },
  remove: async (id: number) => {
    await http.delete(`/items/${id}`);
  }
};