import { Request, Response } from "express";
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
  if (req.user?.role === "STUDENT") {
    const loans = await listLoansByUser(req.user.id);
    return res.json(loans);
  }
  const loans = await listLoans();
  res.json(loans);
};

export const getMyLoans = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const loans = await listLoansByUser(req.user.id);
  res.json(loans);
};

export const getLoan = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid loan id", 400);
  const loan = await getLoanById(id);
  res.json(loan);
};

export const createLoanHandler = async (req: AuthRequest, res: Response) => {
  const data = createLoanSchema.parse(req.body);
  const loan = await createLoan(data.userId, data.itemId, data.dueAt);
  await logAction("LOAN_CREATED", req.user?.id, "Loan", loan.id);
  res.status(201).json(loan);
};

export const returnLoanHandler = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid loan id", 400);
  const loan = await markLoanReturned(id);
  await logAction("LOAN_RETURNED", req.user?.id, "Loan", loan.id);
  res.json(loan);
};

export const updateLoanStatusHandler = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError("Invalid loan id", 400);
  const { status } = updateStatusSchema.parse(req.body);
  const loan = await updateLoanStatus(id, status);
  await logAction("LOAN_STATUS_UPDATED", req.user?.id, "Loan", loan.id);
  res.json(loan);
};