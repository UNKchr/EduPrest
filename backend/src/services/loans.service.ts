import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

type DbClient = Prisma.TransactionClient | typeof prisma;

const loanInclude = {
  user: { select: { id: true, email: true, fullName: true, role: true } },
  item: { select: { id: true, name: true, code: true } }
};

const markOverdueLoans = async (organizationId: number, db: DbClient = prisma) => {
  const now = new Date();
  await db.loan.updateMany({
    where: {
      organizationId,
      status: "ACTIVE",
      dueAt: { lt: now }
    },
    data: { status: "OVERDUE" }
  });
};

const userHasOverdueLoans = async (
  userId: number,
  organizationId: number,
  db: DbClient = prisma
) => {
  const now = new Date();
  const count = await db.loan.count({
    where: {
      userId,
      organizationId,
      OR: [
        { status: "OVERDUE" },
        { status: "ACTIVE", dueAt: { lt: now } }
      ]
    }
  });
  return count > 0;
};

const ensureUserInOrg = async (userId: number, organizationId: number, db: DbClient = prisma) => {
  const user = await db.user.findFirst({ where: { id: userId, organizationId } });
  if (!user) throw new ApiError("User not found", 404);
  if (user.status === "BANNED") throw new ApiError("User is banned", 403);
  return user;
};

const ensureItemInOrg = async (itemId: number, organizationId: number, db: DbClient = prisma) => {
  const item = await db.item.findFirst({ where: { id: itemId, organizationId } });
  if (!item) throw new ApiError("Item not found", 404);
  if (!item.isActive) throw new ApiError("Item inactive", 400);
  return item;
};

const isRetryableTransactionError = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";

export const listLoans = async (organizationId: number) => {
  await markOverdueLoans(organizationId);
  return prisma.loan.findMany({
    where: { organizationId },
    orderBy: { loanedAt: "desc" },
    include: loanInclude
  });
};

export const listLoansByUser = async (userId: number, organizationId: number) => {
  await markOverdueLoans(organizationId);
  return prisma.loan.findMany({
    where: { userId, organizationId },
    orderBy: { loanedAt: "desc" },
    include: loanInclude
  });
};

export const getLoanById = async (id: number, organizationId: number) => {
  await markOverdueLoans(organizationId);
  const loan = await prisma.loan.findFirst({
    where: { id, organizationId },
    include: loanInclude
  });
  if (!loan) throw new ApiError("Loan not found", 404);
  return loan;
};

export const createLoan = async (
  userId: number,
  itemId: number,
  dueAt: string,
  organizationId: number
) => {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await markOverdueLoans(organizationId, tx);

          await ensureUserInOrg(userId, organizationId, tx);
          const item = await ensureItemInOrg(itemId, organizationId, tx);

          const hasOverdue = await userHasOverdueLoans(userId, organizationId, tx);
          if (hasOverdue) {
            throw new ApiError("User has overdue loans", 409);
          }

          const activeCount = await tx.loan.count({
            where: { itemId, organizationId, status: "ACTIVE" }
          });

          if (activeCount >= item.quantity) {
            throw new ApiError("Item not available", 409);
          }

          return tx.loan.create({
            data: {
              userId,
              itemId,
              dueAt: new Date(dueAt),
              organizationId
            },
            include: loanInclude
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      if (isRetryableTransactionError(err) && attempt < maxRetries - 1) {
        continue;
      }
      if (isRetryableTransactionError(err)) {
        throw new ApiError("Concurrent update, please retry", 409);
      }
      throw err;
    }
  }

  throw new ApiError("Concurrent update, please retry", 409);
};

export const markLoanReturned = async (id: number, organizationId: number) => {
  const loan = await getLoanById(id, organizationId);
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

export const updateLoanStatus = async (
  id: number,
  status: "ACTIVE" | "RETURNED" | "OVERDUE",
  organizationId: number
) => {
  const loan = await getLoanById(id, organizationId);

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