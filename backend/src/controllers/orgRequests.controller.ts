import { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../middlewares/errorHandler";
import type { AuthRequest } from "../middlewares/auth";
import {
  createOrgRequest,
  listOrgRequests,
  approveOrgRequest,
  rejectOrgRequest
} from "../services/orgRequests.service";

const createSchema = z.object({
  orgName: z.string().min(3, "El nombre de la organización debe tener al menos 3 caracteres"),
  orgNit: z.string().min(3, "El NIT debe tener al menos 3 caracteres"),
  requesterName: z.string().min(3, "El nombre del solicitante debe tener al menos 3 caracteres"),
  requesterEmail: z.string().email("Correo electrónico inválido")
});

const listSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export const requestOrg = async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);
  await createOrgRequest(data.orgName, data.orgNit, data.requesterName, data.requesterEmail);
  res.status(201).json({
    message: "Solicitud de organización enviada. El super administrador revisará tu solicitud."
  });
};

export const listRequests = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { status, limit, offset } = listSchema.parse(req.query);
  const result = await listOrgRequests(status, limit, offset);
  res.json(result);
};

export const approve = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const id = Number(req.params.id);
  if (!id || id <= 0) throw new ApiError("ID inválido", 400);

  await approveOrgRequest(id, req.user.id);
  res.json({ message: "Organización creada exitosamente" });
};

export const reject = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const id = Number(req.params.id);
  if (!id || id <= 0) throw new ApiError("ID inválido", 400);

  await rejectOrgRequest(id, req.user.id);
  res.json({ message: "Solicitud rechazada" });
};
