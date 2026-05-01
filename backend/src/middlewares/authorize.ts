import { Response, NextFunction } from "express";
import { ApiError } from "./errorHandler";
import { AuthRequest } from "./auth";
import { hasMinRole, type Role } from "../utils/roles";

export const authorize = (minRole: Role) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError("Unauthorized", 401);
    }
    if (!hasMinRole(req.user.role, minRole)) {
      throw new ApiError("Forbidden", 403);
    }
    next();
  };
};