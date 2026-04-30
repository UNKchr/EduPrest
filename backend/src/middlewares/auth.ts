import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "./errorHandler";

type JwtPayload = {
  sub: string;
  role: string;
};

export interface AuthRequest extends Request {
  user?: {  id: number; role: string};
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    throw new ApiError("Missing or invalid Authorization header", 401);
  }

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch {
    throw new ApiError("Invalid or expired token", 401);
  }
}