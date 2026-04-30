import { Request, Response } from "express";
import { z } from "zod";
import { createUser, validateUser } from "../services/auth.service";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";
import { redis } from "../config/redis";
import { ApiError } from "../middlewares/errorHandler";
import { env } from "../config/env";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(3)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const refreshKey = (jti: string) => `refresh:${jti}`;

export const register = async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const user = await createUser(data.email, data.password, data.fullName);

  const accessToken = signAccessToken(user.id, user.role);
  const { token: refreshToken, jti } = signRefreshToken(user.id);

  await redis.set(refreshKey(jti), String(user.id), "EX", 60 * 60 * 24 * 7);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/auth/refresh"
  });

  res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role } });
};

export const login = async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const user = await validateUser(data.email, data.password);

  const accessToken = signAccessToken(user.id, user.role);
  const { token: refreshToken, jti } = signRefreshToken(user.id);

  await redis.set(refreshKey(jti), String(user.id), "EX", 60 * 60 * 24 * 7);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/auth/refresh"
  });

  res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role } });
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError("Missing refresh token", 401);

  const payload = verifyRefreshToken(token);
  const exists = await redis.get(refreshKey(payload.jti));
  if (!exists) throw new ApiError("Refresh token revoked", 401);

  // Rotación de refresh token
  await redis.del(refreshKey(payload.jti));
  const { token: newRefresh, jti: newJti } = signRefreshToken(payload.sub);
  await redis.set(refreshKey(newJti), String(payload.sub), "EX", 60 * 60 * 24 * 7);

  const accessToken = signAccessToken(payload.sub, "STUDENT");

  res.cookie("refreshToken", newRefresh, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/auth/refresh"
  });

  res.json({ accessToken });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await redis.del(refreshKey(payload.jti));
    } catch {
      // si es inválido, igual limpiamos cookie
    }
  }

  res.clearCookie("refreshToken", { path: "/auth/refresh" });
  res.json({ message: "Logged out" });
};