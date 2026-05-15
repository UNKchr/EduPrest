import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

export const createAccessRequest = async (
  fullName: string,
  email: string,
  password: string,
  organizationId: number
) => {
  // Prevent duplicate pending requests for the same email+org
  const existing = await prisma.accessRequest.findFirst({
    where: { email, organizationId, status: "PENDING" }
  });
  if (existing) throw new ApiError("Ya existe una solicitud pendiente para este correo en esta organización", 409);

  // Prevent requests for already-registered emails
  const userExists = await prisma.user.findFirst({ where: { email, organizationId } });
  if (userExists) throw new ApiError("El correo ya está registrado en esta organización", 409);

  const hashed = await bcrypt.hash(password, 12);

  return prisma.accessRequest.create({
    data: { fullName, email, password: hashed, organizationId }
  });
};

export const listAccessRequests = async (
  organizationId: number,
  status?: "PENDING" | "APPROVED" | "REJECTED",
  limit = 20,
  offset = 0
) => {
  const where = {
    organizationId,
    ...(status ? { status } : {})
  };

  const [data, total] = await Promise.all([
    prisma.accessRequest.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        createdAt: true,
        decidedAt: true,
        organization: { select: { id: true, name: true, nit: true } }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    }),
    prisma.accessRequest.count({ where })
  ]);

  return { data, total };
};

export const approveAccessRequest = async (id: number, decidedById: number) => {
  const request = await prisma.accessRequest.findUnique({
    where: { id },
    include: { organization: true }
  });
  if (!request) throw new ApiError("Solicitud no encontrada", 404);
  if (request.status !== "PENDING") throw new ApiError("La solicitud ya fue procesada", 409);
  if (request.organization.status === "BANNED") throw new ApiError("La organización está baneada", 400);

  // Re-check email uniqueness at approval time
  const userExists = await prisma.user.findFirst({
    where: { email: request.email, organizationId: request.organizationId }
  });
  if (userExists) {
    await prisma.accessRequest.update({
      where: { id },
      data: { status: "REJECTED", decidedAt: new Date(), decidedById }
    });
    throw new ApiError("El correo ya fue registrado en la organización; solicitud rechazada automáticamente", 409);
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        email: request.email,
        password: request.password, // already bcrypt-hashed
        fullName: request.fullName,
        organizationId: request.organizationId,
        role: "STUDENT"
      }
    });
    return tx.accessRequest.update({
      where: { id },
      data: { status: "APPROVED", decidedAt: new Date(), decidedById }
    });
  });
};

export const rejectAccessRequest = async (id: number, decidedById: number) => {
  const request = await prisma.accessRequest.findUnique({ where: { id } });
  if (!request) throw new ApiError("Solicitud no encontrada", 404);
  if (request.status !== "PENDING") throw new ApiError("La solicitud ya fue procesada", 409);

  return prisma.accessRequest.update({
    where: { id },
    data: { status: "REJECTED", decidedAt: new Date(), decidedById }
  });
};
