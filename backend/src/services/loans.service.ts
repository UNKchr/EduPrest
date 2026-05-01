import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

const loanInclude = {
  user: { select: { id: true, email: true, fullName: true, role: true } },
  item: { select: { id: true, name: true, code: true } }
};

const markOverdueLoans = async () => {
  const now = new Date();
  await prisma.loan.updateMany({
    where: {
      status: "ACTIVE",
      dueAt: { lt: now }
    },
    data: { status: "OVERDUE" }
  });
};

const userHasOverdueLoans = async (userId: number) => {
  const now = new Date();
  const count = await prisma.loan.count({
    where: {
      userId,
      OR: [
        { status: "OVERDUE" },
        { status: "ACTIVE", dueAt: { lt: now } }
      ]
    }
  });
  return count > 0;
};

export const listLoans = async () => {
  await markOverdueLoans();
  return prisma.loan.findMany({
    orderBy: { loanedAt: "desc" },
    include: loanInclude
  });
};

export const listLoansByUser = async (userId: number) => {
  await markOverdueLoans();
  return prisma.loan.findMany({
    where: { userId },
    orderBy: { loanedAt: "desc" },
    include: loanInclude
  });
};

export const getLoanById = async (id: number) => {
  await markOverdueLoans();
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: loanInclude
  });
  if (!loan) throw new ApiError("Loan not found", 404);
  return loan;
};

export const createLoan = async (userId: number, itemId: number, dueAt: string) => {
  await markOverdueLoans();

  const hasOverdue = await userHasOverdueLoans(userId);
  if (hasOverdue) {
    throw new ApiError("User has overdue loans", 409);
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new ApiError("Item not found", 404);
  if (!item.isActive) throw new ApiError("Item inactive", 400);

  const activeCount = await prisma.loan.count({
    where: { itemId, status: "ACTIVE" }
  });

  if (activeCount >= item.quantity) {
    throw new ApiError("Item not available", 409);
  }

  return prisma.loan.create({
    data: {
      userId,
      itemId,
      dueAt: new Date(dueAt)
    },
    include: loanInclude
  });
};

export const markLoanReturned = async (id: number) => {
  const loan = await getLoanById(id);
  if (loan.status === "RETURNED") throw new ApiError("Loan already returned", 400);

  return prisma.loan.update({
    where: { id },
    data: {
      status: "RETURNED",
      returnedAt: new Date()
    },
    include: loanInclude
  });
};

export const updateLoanStatus = async (id: number, status: "ACTIVE" | "RETURNED" | "OVERDUE") => {
  const loan = await getLoanById(id);

  const data: { status: "ACTIVE" | "RETURNED" | "OVERDUE"; returnedAt?: Date | null } = { status };

  if (status === "RETURNED" && !loan.returnedAt) {
    data.returnedAt = new Date();
  }

  return prisma.loan.update({
    where: { id },
    data,
    include: loanInclude
  });
};