import { Response, NextFunction } from "express";
import { ApiError } from "./errorHandler";
import { AuthRequest } from "./auth";

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError("Unauthorized", 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError("Forbidden", 403);
    }
    next();
  };
};