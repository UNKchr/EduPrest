import { prisma } from "../config/prisma";

export const getSummaryReport = async (organizationId: number) => {
  const now = new Date();

  const [totalItems, activeItems, totalLoans, activeLoans, returnedLoans, overdueLoans] =
    await Promise.all([
      prisma.item.count({ where: { organizationId } }),
      prisma.item.count({ where: { organizationId, isActive: true } }),
      prisma.loan.count({ where: { organizationId } }),
      prisma.loan.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.loan.count({ where: { organizationId, status: "RETURNED" } }),
      prisma.loan.count({
        where: {
          organizationId,
          OR: [
            { status: "OVERDUE" },
            { status: "ACTIVE", dueAt: { lt: now } }
          ]
        }
      })
    ]);

  const top = await prisma.loan.groupBy({
    by: ["itemId"],
    where: { organizationId },
    _count: { itemId: true },
    orderBy: { _count: { itemId: "desc" } },
    take: 5
  });

  const topItems = await prisma.item.findMany({
    where: { id: { in: top.map((t) => t.itemId) }, organizationId }
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