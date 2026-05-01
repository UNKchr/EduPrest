import { prisma } from "../config/prisma";

export const getSummaryReport = async () => {
  const now = new Date();

  const [totalItems, activeItems, totalLoans, activeLoans, returnedLoans, overdueLoans] =
    await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { isActive: true } }),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({ where: { status: "RETURNED" } }),
      prisma.loan.count({
        where: {
          OR: [
            { status: "OVERDUE" },
            { status: "ACTIVE", dueAt: { lt: now } }
          ]
        }
      })
    ]);

  const top = await prisma.loan.groupBy({
    by: ["itemId"],
    _count: { itemId: true },
    orderBy: { _count: { itemId: "desc" } },
    take: 5
  });

  const topItems = await prisma.item.findMany({
    where: { id: { in: top.map((t) => t.itemId) } }
  });

  const topItemsReport = top.map((t) => {
    const item = topItems.find((i) => i.id === t.itemId);
    return {
      itemId: t.itemId,
      name: item?.name || "Unknown",
      code: item?.code || "",
      totalLoans: t._count.itemId
    };
  });

  return {
    items: { totalItems, activeItems },
    loans: { totalLoans, activeLoans, returnedLoans, overdueLoans },
    topItems: topItemsReport
  };
};