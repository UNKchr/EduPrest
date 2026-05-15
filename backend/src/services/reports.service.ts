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

export const getDashboardMetrics = async (organizationId: number) => {
  const [activeLoans, availableItems, bannedUsers] = await Promise.all([
    prisma.loan.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.item.count({ where: { organizationId, isActive: true, quantity: { gt: 0 } } }),
    prisma.user.count({ where: { organizationId, status: "BANNED" } })
  ]);

  return { activeLoans, availableItems, bannedUsers };
};

export const getAdminSummary = async (organizationId: number) => {
  const [activeUsers, pendingReports, availableItems] = await Promise.all([
    prisma.user.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.userReport.count({ where: { organizationId, status: "PENDING" } }),
    prisma.item.count({ where: { organizationId, isActive: true, quantity: { gt: 0 } } })
  ]);

  return { activeUsers, pendingReports, availableItems };
};

// orgId === null → global (SUPER_ADMIN), orgId number → org-scoped
export const getOrgAnalytics = async (orgId: number | null) => {
  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  const orgWhere = orgId !== null ? { organizationId: orgId } : {};

  const [weeklyLoanData, activeLoans, overdueLoans, availableItems, recentLoans, orgsData] =
    await Promise.all([
      prisma.loan.findMany({
        where: { ...orgWhere, loanedAt: { gte: eightWeeksAgo } },
        select: { loanedAt: true, returnedAt: true }
      }),
      prisma.loan.count({ where: { ...orgWhere, status: "ACTIVE" } }),
      prisma.loan.count({
        where: {
          ...orgWhere,
          OR: [{ status: "OVERDUE" }, { status: "ACTIVE", dueAt: { lt: now } }]
        }
      }),
      prisma.item.count({ where: { ...orgWhere, isActive: true, quantity: { gt: 0 } } }),
      prisma.loan.findMany({
        where: orgWhere,
        include: {
          item: { select: { name: true, code: true } },
          user: { select: { email: true, fullName: true } },
          organization: { select: { name: true } }
        },
        orderBy: { loanedAt: "desc" },
        take: 40
      }),
      orgId === null
        ? prisma.organization.findMany({
            select: {
              id: true,
              name: true,
              nit: true,
              _count: { select: { loans: true, users: true, items: true } }
            },
            orderBy: { name: "asc" }
          })
        : Promise.resolve(null)
    ]);

  // Build weekly stats from oldest to newest (8 buckets)
  const weeklyStats = Array.from({ length: 8 }, (_, idx) => {
    const i = 7 - idx;
    const bucketEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const bucketStart = new Date(bucketEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const label = i === 0 ? "Esta sem" : i === 1 ? "Hace 1 sem" : `Hace ${i} sem`;
    return {
      week: label,
      loans: weeklyLoanData.filter((l) => {
        const d = new Date(l.loanedAt);
        return d >= bucketStart && d < bucketEnd;
      }).length,
      returns: weeklyLoanData.filter((l) => {
        if (!l.returnedAt) return false;
        const d = new Date(l.returnedAt);
        return d >= bucketStart && d < bucketEnd;
      }).length
    };
  });

  return {
    weeklyStats,
    activeLoans,
    overdueLoans,
    availableItems,
    recentActivity: recentLoans.map((l) => ({
      id: l.id,
      itemName: l.item.name,
      itemCode: l.item.code,
      userEmail: l.user.email,
      userFullName: l.user.fullName,
      orgName: l.organization.name,
      loanedAt: l.loanedAt,
      dueAt: l.dueAt,
      returnedAt: l.returnedAt ?? null,
      status: l.status
    })),
    orgs: orgsData
      ? orgsData.map((o) => ({
          id: o.id,
          name: o.name,
          nit: o.nit,
          totalLoans: o._count.loans,
          totalUsers: o._count.users,
          totalItems: o._count.items
        }))
      : null
  };
};