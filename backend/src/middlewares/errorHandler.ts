import { Request, Response, NextFunction } from "express";
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);
  const status = err instanceof ApiError ? err.status : 500;
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.message
  });
}