"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { getEmailStatistics } from "@/lib/email-quota";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";

/* =====================================================
   HELPER: Serialize email data
===================================================== */
function serializeEmailLog(log: any) {
  return {
    ...log,
    createdAt: log.createdAt?.toISOString(),
    user: log.user
      ? {
          ...log.user,
          createdAt: log.user.createdAt?.toISOString?.() ?? log.user.createdAt,
          updatedAt: log.user.updatedAt?.toISOString?.() ?? log.user.updatedAt,
        }
      : null,
  };
}

function serializeEmailCounter(counter: any) {
  return {
    ...counter,
    date: counter.date?.toISOString(),
    createdAt: counter.createdAt?.toISOString(),
    updatedAt: counter.updatedAt?.toISOString(),
    user: counter.user
      ? {
          ...counter.user,
          createdAt:
            counter.user.createdAt?.toISOString?.() ?? counter.user.createdAt,
          updatedAt:
            counter.user.updatedAt?.toISOString?.() ?? counter.user.updatedAt,
        }
      : null,
  };
}

/* =====================================================
   CACHE TAGS
===================================================== */
const TAGS = {
  stats: "email:stats",
  logs: "email:logs",
  counters: "email:counters",
  filters: "email:filters",
  topToday: "email:top-today",
};

function keyFromParams(prefix: string, params: any) {
  return `${prefix}:${JSON.stringify(params ?? {})}`;
}

/* =====================================================
   ADMIN: GET EMAIL STATISTICS (CACHED)
===================================================== */
const cachedEmailStatisticsAction = unstable_cache(
  async () => {
    const stats = await getEmailStatistics();
    const percentageUsed = Math.min(stats.systemQuota.percentageUsed, 100);

    const topUsers = stats.topUsers.map((counter: any) => ({
      ...counter,
      date: counter.date?.toISOString?.() ?? counter.date,
      createdAt: counter.createdAt?.toISOString?.() ?? counter.createdAt,
      updatedAt: counter.updatedAt?.toISOString?.() ?? counter.updatedAt,
      user: counter.user ? { ...counter.user } : null,
    }));

    const recentEmails = stats.recentEmails.map((log: any) => ({
      ...log,
      createdAt: log.createdAt?.toISOString?.() ?? log.createdAt,
      user: log.user ? { ...log.user } : null,
    }));

    return {
      systemQuota: {
        today: stats.systemQuota.today,
        yesterday: stats.systemQuota.yesterday,
        limit: stats.systemQuota.limit,
        percentageUsed,
      },
      topUsers,
      recentEmails,
      totalEmails: stats.totalEmails,
      userLimit: stats.userLimit,
    };
  },
  ["email:statistics:action"],
  { revalidate: 60, tags: [TAGS.stats] },
);

export async function getEmailStatisticsAction() {
  await requireRole(["ADMIN"]);
  return cachedEmailStatisticsAction();
}

/* =====================================================
   ADMIN: GET EMAIL LOGS WITH PAGINATION & FILTERS (CACHED)
===================================================== */
function cachedGetEmailLogs(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const cacheKey = keyFromParams("emailLogs", params);

  return unstable_cache(
    async () => {
      const {
        page = 1,
        pageSize = 10,
        search = "",
        type,
        userId,
        startDate,
        endDate,
      } = params || {};

      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      if (type && type !== "all") where.type = type;
      if (userId && userId !== "all") where.userId = userId;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [totalCount, logs, emailTypes] = await Promise.all([
        prisma.emailLog.count({ where }),
        prisma.emailLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          skip,
          take: pageSize,
        }),
        prisma.emailLog.groupBy({
          by: ["type"],
          _count: { type: true },
          orderBy: { type: "asc" },
        }),
      ]);

      return {
        logs: logs.map(serializeEmailLog),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
        filters: {
          types: emailTypes.map((t) => t.type),
        },
      };
    },
    [cacheKey],
    { revalidate: 30, tags: [TAGS.logs, TAGS.filters] },
  )();
}

export async function getEmailLogsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  await requireRole(["ADMIN"]);
  return cachedGetEmailLogs(params);
}

/* =====================================================
   ADMIN: GET EMAIL COUNTERS WITH PAGINATION & FILTERS (CACHED)
===================================================== */
function cachedGetEmailCounters(params?: {
  page?: number;
  pageSize?: number;
  scope?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  minCount?: number;
}) {
  const cacheKey = keyFromParams("emailCounters", params);

  return unstable_cache(
    async () => {
      const {
        page = 1,
        pageSize = 10,
        scope,
        userId,
        startDate,
        endDate,
        minCount,
      } = params || {};

      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (scope && scope !== "all") where.scope = scope;
      if (userId && userId !== "all") where.userId = userId;

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      if (minCount && minCount > 0) where.count = { gte: minCount };

      const [totalCount, counters, summary] = await Promise.all([
        prisma.emailCounter.count({ where }),
        prisma.emailCounter.findMany({
          where,
          orderBy: [{ date: "desc" }, { count: "desc" }],
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          skip,
          take: pageSize,
        }),
        prisma.emailCounter.aggregate({
          where,
          _sum: { count: true },
          _avg: { count: true },
          _max: { count: true, date: true },
        }),
      ]);

      return {
        counters: counters.map(serializeEmailCounter),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
        summary: {
          totalEmails: summary._sum.count || 0,
          averagePerDay: Math.round(summary._avg.count || 0),
          maxInOneDay: summary._max.count || 0,
          lastDate: summary._max.date?.toISOString(),
        },
      };
    },
    [cacheKey],
    { revalidate: 60, tags: [TAGS.counters, TAGS.filters] },
  )();
}

export async function getEmailCountersAction(params?: {
  page?: number;
  pageSize?: number;
  scope?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  minCount?: number;
}) {
  await requireRole(["ADMIN"]);
  return cachedGetEmailCounters(params);
}

/* =====================================================
   ADMIN: DELETE EMAIL LOGS (INVALIDATE)
===================================================== */
export async function deleteEmailLogsAction(ids: string[]) {
  await requireRole(["ADMIN"]);

  const result = await prisma.emailLog.deleteMany({
    where: { id: { in: ids } },
  });

  updateTag(TAGS.logs);
  updateTag(TAGS.stats);

  revalidatePath("/dashboard/admin/email-logs");
  return { success: true, deletedCount: result.count };
}

/* =====================================================
   ADMIN: DELETE EMAIL COUNTERS (INVALIDATE)
===================================================== */
export async function deleteEmailCountersAction(ids: string[]) {
  await requireRole(["ADMIN"]);

  const result = await prisma.emailCounter.deleteMany({
    where: { id: { in: ids } },
  });

  updateTag(TAGS.counters);
  updateTag(TAGS.stats);

  revalidatePath("/dashboard/admin/email-counters");
  return { success: true, deletedCount: result.count };
}

/* =====================================================
   ADMIN: GET USER LIST FOR FILTER (CACHED)
===================================================== */
const cachedUsersForFilter = unstable_cache(
  async () => {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ emailLogs: { some: {} } }, { emailCounters: { some: {} } }],
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    return users;
  },
  ["email:usersForFilter"],
  { revalidate: 300, tags: [TAGS.filters] },
);

export async function getUsersForFilterAction() {
  await requireRole(["ADMIN"]);
  return cachedUsersForFilter();
}

/* =====================================================
   ADMIN: CLEANUP OLD LOGS (INVALIDATE)
===================================================== */
export async function cleanupOldEmailLogsAction(daysOld: number = 30) {
  await requireRole(["ADMIN"]);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.emailLog.deleteMany({
    where: {
      createdAt: { lte: cutoffDate },
    },
  });

  updateTag(TAGS.logs);
  updateTag(TAGS.stats);

  revalidatePath("/dashboard/admin/email-logs");
  return {
    success: true,
    deletedCount: result.count,
    message: `Deleted ${result.count} email logs older than ${daysOld} days`,
  };
}

/* =====================================================
   ADMIN: RESET COUNTER (INVALIDATE)
===================================================== */
export async function resetEmailCounterAction(id: string) {
  await requireRole(["ADMIN"]);

  const counter = await prisma.emailCounter.update({
    where: { id },
    data: { count: 0 },
  });

  updateTag(TAGS.counters);
  updateTag(TAGS.stats);

  revalidatePath("/dashboard/admin/email-counters");
  return { success: true, counter: serializeEmailCounter(counter) };
}
