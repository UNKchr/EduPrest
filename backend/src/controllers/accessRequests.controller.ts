import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";
import type { AuthRequest } from "../middlewares/auth";
import {
  createAccessRequest,
  listAccessRequests,
  approveAccessRequest,
  rejectAccessRequest
} from "../services/accessRequests.service";

const createSchema = z.object({
  fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  organizationNit: z.string().min(3, "NIT inválido")
});

const listSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export const requestAccess = async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);

  const org = await prisma.organization.findUnique({ where: { nit: data.organizationNit } });
  if (!org || org.status === "BANNED") {
    throw new ApiError("Organización no encontrada o inactiva", 400);
  }

  await createAccessRequest(data.fullName, data.email, data.password, org.id);
  res.status(201).json({
    message: "Solicitud enviada correctamente. El administrador revisará tu solicitud."
  });
};

export const listRequests = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { status, limit, offset } = listSchema.parse(req.query);
  const result = await listAccessRequests(req.user.orgId, status, limit, offset);
  res.json(result);
};

export const approve = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const id = Number(req.params.id);
  if (!id || id <= 0) throw new ApiError("ID inválido", 400);

  // Verify the request belongs to this admin's organization
  const request = await prisma.accessRequest.findUnique({ where: { id } });
  if (!request) throw new ApiError("Solicitud no encontrada", 404);
  if (request.organizationId !== req.user.orgId && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403);
  }

  await approveAccessRequest(id, req.user.id);
  res.json({ message: "Acceso concedido exitosamente" });
};

export const reject = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const id = Number(req.params.id);
  if (!id || id <= 0) throw new ApiError("ID inválido", 400);

  const request = await prisma.accessRequest.findUnique({ where: { id } });
  if (!request) throw new ApiError("Solicitud no encontrada", 404);
  if (request.organizationId !== req.user.orgId && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403);
  }

  await rejectAccessRequest(id, req.user.id);
  res.json({ message: "Solicitud rechazada" });
};
