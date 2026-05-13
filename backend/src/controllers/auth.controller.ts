import { Request, Response } from "express";
import { z } from "zod";
import { createUser, validateUser } from "../services/auth.service";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";
import { redis } from "../config/redis";
import { ApiError } from "../middlewares/errorHandler";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(3),
  organizationNit: z.string().min(3)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  organizationNit: z.string().min(3)
});

const refreshKey = (jti: string) => `refresh:${jti}`;

export const register = async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const org = await prisma.organization.findUnique({ where: { nit: data.organizationNit } });
  if (!org || org.status === "BANNED") {
    throw new ApiError("Invalid registration data", 400);
  }

  const user = await createUser(data.email, data.password, data.fullName, org.id, "STUDENT");

  const accessToken = signAccessToken(user.id, user.role, user.organizationId);
  const { token: refreshToken, jti } = signRefreshToken(user.id);

  await redis.set(refreshKey(jti), String(user.id), "EX", 60 * 60 * 24 * 7);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/auth"
  });

  res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role, orgId: user.organizationId } });
};

export const login = async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const org = await prisma.organization.findUnique({ where: { nit: data.organizationNit } });
  if (!org || org.status === "BANNED") {
    throw new ApiError("Invalid credentials", 401);
  }

  const user = await validateUser(data.email, data.password, org.id);

  const accessToken = signAccessToken(user.id, user.role, user.organizationId);
  const { token: refreshToken, jti } = signRefreshToken(user.id);

  await redis.set(refreshKey(jti), String(user.id), "EX", 60 * 60 * 24 * 7);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/auth"
  });

  res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role, orgId: user.organizationId } });
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError("Missing refresh token", 401);

  const payload = verifyRefreshToken(token);
  const exists = await redis.get(refreshKey(payload.jti));
  if (!exists) throw new ApiError("Refresh token revoked", 401);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { organization: true }
  });
  if (!user) throw new ApiError("User not found", 401);
  if (user.status === "BANNED") throw new ApiError("User is banned", 403);
  if (user.organization.status === "BANNED") throw new ApiError("Organization is banned", 403);

  await redis.del(refreshKey(payload.jti));
  const { token: newRefresh, jti: newJti } = signRefreshToken(payload.sub);
  await redis.set(refreshKey(newJti), String(payload.sub), "EX", 60 * 60 * 24 * 7);

  const accessToken = signAccessToken(user.id, user.role, user.organizationId);
  const userInfo = { id: user.id, email: user.email, role: user.role, orgId: user.organizationId };

  res.cookie("refreshToken", newRefresh, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/auth"
  });

  res.json({ accessToken, user: userInfo });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await redis.del(refreshKey(payload.jti));
    } catch {
      // ignore
    }
  }

  res.clearCookie("refreshToken", {
    path: "/auth",
    sameSite: "lax",
    secure: env.cookieSecure
  });
  res.json({ message: "Logged out" });
};