import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";
import type { Role } from "../utils/roles";

export const createUser = async (
  email: string,
  password: string,
  fullName: string,
  organizationId: number,
  role: Role = "STUDENT"
) => {
  const exists = await prisma.user.findFirst({ where: { email, organizationId } });
  if (exists) throw new ApiError("Email already in use", 409);

  const hash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: { email, password: hash, fullName, organizationId, role }
  });
};

export const validateUser = async (email: string, password: string, organizationId: number) => {
  const user = await prisma.user.findFirst({
    where: { email, organizationId },
    include: { organization: true }
  });
  if (!user) throw new ApiError("Invalid credentials", 401);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new ApiError("Invalid credentials", 401);

  if (user.status === "BANNED") throw new ApiError("User is banned", 403);
  if (user.organization.status === "BANNED") throw new ApiError("Organization is banned", 403);

  return user;
};