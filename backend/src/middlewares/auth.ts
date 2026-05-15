import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "./errorHandler";
import { prisma } from "../config/prisma";
import type { Role } from "../utils/roles";

type JwtPayload = {
  sub: string;
  role: Role;
  orgId: number;
};

export interface AuthRequest extends Request {
  user?: { id: number; role: Role; orgId: number };
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    throw new ApiError("Missing or invalid Authorization header", 401);
  }

  const token = auth.split(" ")[1];
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
  } catch {
    throw new ApiError("Invalid or expired token", 401);
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ApiError("Invalid or expired token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true }
  });

  if (!user) throw new ApiError("Invalid or expired token", 401);
  if (user.status === "BANNED") throw new ApiError("User is banned", 403);
  if (user.organization.status === "BANNED") {
    throw new ApiError("Organization is banned", 403);
  }

  req.user = { id: user.id, role: user.role as Role, orgId: user.organizationId };
  return next();
};