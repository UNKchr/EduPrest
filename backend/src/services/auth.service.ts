import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

export const createUser = async (email: string, password: string, fullName: string) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ApiError("Email already in use", 409);

  const hash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: { email, password: hash, fullName }
  });
};

export const validateUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError("Invalid credentials", 401);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new ApiError("Invalid credentials", 401);

  return user;
};