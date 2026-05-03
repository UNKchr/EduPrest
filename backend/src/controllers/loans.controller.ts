import { Response } from "express";
import { z } from "zod";
import { ApiError } from "../middlewares/errorHandler";
import type { AuthRequest } from "../middlewares/auth";
import {
  createLoan,
  getLoanById,
  listLoans,
  listLoansByUser,
  markLoanReturned,
  updateLoanStatus
} from "../services/loans.service";
import { logAction } from "../services/audit.service";

const createLoanSchema = z.object({
  userId: z.number().int(),
  itemId: z.number().int(),
  dueAt: z.string().datetime()
});

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "RETURNED", "OVERDUE"])
});

export const getLoans = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role === "STUDENT") {
    const loans = await listLoansByUser(req.user.id, req.user.orgId);
    return res.json(loans);
  }
  const loans = await listLoans(req.user.orgId);
  res.json(loans);
};

export const getMyLoans = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const loans = await listLoansByUser(req.user.id, req.user.orgId);
  res.json(loans);
};

export const getLoan = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid loan id", 400);
  const loan = await getLoanById(id, req.user.orgId);
  res.json(loan);
};

export const createLoanHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const data = createLoanSchema.parse(req.body);
  const loan = await createLoan(data.userId, data.itemId, data.dueAt, req.user.orgId);
  await logAction("LOAN_CREATED", req.user.id, "Loan", loan.id, req.user.orgId);
  res.status(201).json(loan);
};

export const returnLoanHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid loan id", 400);
  const loan = await markLoanReturned(id, req.user.orgId);
  await logAction("LOAN_RETURNED", req.user.id, "Loan", loan.id, req.user.orgId);
  res.json(loan);
};

export const updateLoanStatusHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid loan id", 400);
  const { status } = updateStatusSchema.parse(req.body);
  const loan = await updateLoanStatus(id, status, req.user.orgId);
  await logAction("LOAN_STATUS_UPDATED", req.user.id, "Loan", loan.id, req.user.orgId);
  res.json(loan);
};