import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { SYSTEM_DAILY_LIMIT, USER_DAILY_LIMIT, todayUTC } from "./email-limit";

const cachedEmailStatistics = unstable_cache(
  async () => {
    const today = todayUTC();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [
      todaySystemCount,
      yesterdaySystemCount,
      todayUserCounts,
      recentEmailLogs,
      totalSystemCount,
    ] = await Promise.all([
      prisma.emailCounter.findUnique({
        where: {
          scope_key_date: {
            scope: "GLOBAL",
            key: "SYSTEM",
            date: today,
          },
        },
      }),

      prisma.emailCounter.findUnique({
        where: {
          scope_key_date: {
            scope: "GLOBAL",
            key: "SYSTEM",
            date: yesterday,
          },
        },
      }),

      prisma.emailCounter.findMany({
        where: {
          scope: "USER",
          date: today,
        },
        orderBy: {
          count: "desc",
        },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      prisma.emailLog.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      prisma.emailLog.count(),
    ]);

    return {
      systemQuota: {
        today: todaySystemCount?.count || 0,
        yesterday: yesterdaySystemCount?.count || 0,
        limit: SYSTEM_DAILY_LIMIT,
        percentageUsed: Math.round(
          ((todaySystemCount?.count || 0) / SYSTEM_DAILY_LIMIT) * 100,
        ),
      },
      topUsers: todayUserCounts,
      recentEmails: recentEmailLogs,
      totalEmails: totalSystemCount,
      userLimit: USER_DAILY_LIMIT,
    };
  },
  ["email:stats"],
  { revalidate: 60, tags: ["email:stats"] },
);

export async function getEmailStatistics() {
  return cachedEmailStatistics();
}
