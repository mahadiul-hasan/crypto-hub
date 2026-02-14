import prisma from "@/lib/prisma";
import { updateTag } from "next/cache";

export const USER_DAILY_LIMIT = 5;
export const SYSTEM_DAILY_LIMIT = 400;

export function todayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function isQuotaError(message: string) {
  return (
    message.includes("Daily email limit reached") ||
    message.includes("System email quota exceeded") ||
    message.includes("Please wait")
  );
}

// ✅ CHECK ONLY (no increment here)
export async function checkEmailQuota(userId: string, isAdmin?: boolean) {
  const today = todayUTC();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  return prisma.$transaction(async (tx) => {
    if (!isAdmin) {
      const recentEmail = await tx.emailLog.findFirst({
        where: { userId, createdAt: { gte: oneMinuteAgo } },
        orderBy: { createdAt: "desc" },
      });

      if (recentEmail) {
        const timePassed = Date.now() - recentEmail.createdAt.getTime();
        const secondsLeft = Math.ceil((60000 - timePassed) / 1000);
        throw new Error(
          `Please wait ${secondsLeft} seconds before sending another email`,
        );
      }

      const userCounter = await tx.emailCounter.findUnique({
        where: {
          scope_key_date: { scope: "USER", key: userId, date: today },
        },
      });

      if ((userCounter?.count || 0) >= USER_DAILY_LIMIT) {
        throw new Error("Daily email limit reached");
      }
    }

    const systemCounter = await tx.emailCounter.findUnique({
      where: {
        scope_key_date: { scope: "GLOBAL", key: "SYSTEM", date: today },
      },
    });

    if ((systemCounter?.count || 0) >= SYSTEM_DAILY_LIMIT) {
      throw new Error("System email quota exceeded");
    }

    return true;
  });
}

// ✅ CONSUME + LOG AFTER successful send
export async function consumeEmailQuotaAndLog(
  userId: string,
  email: string,
  type: string,
  isAdmin?: boolean,
) {
  const today = todayUTC();

  await prisma.$transaction(async (tx) => {
    if (!isAdmin) {
      const userCounter = await tx.emailCounter.upsert({
        where: {
          scope_key_date: { scope: "USER", key: userId, date: today },
        },
        create: { scope: "USER", key: userId, date: today, count: 1, userId },
        update: { count: { increment: 1 } },
      });

      if (userCounter.count > USER_DAILY_LIMIT) {
        throw new Error("Daily email limit reached");
      }
    }

    const systemCounter = await tx.emailCounter.upsert({
      where: {
        scope_key_date: { scope: "GLOBAL", key: "SYSTEM", date: today },
      },
      create: {
        scope: "GLOBAL",
        key: "SYSTEM",
        date: today,
        count: 1,
        userId: null,
      },
      update: { count: { increment: 1 } },
    });

    if (systemCounter.count > SYSTEM_DAILY_LIMIT) {
      throw new Error("System email quota exceeded");
    }

    await tx.emailLog.create({
      data: { userId, email, type },
    });
  });

  updateTag("email:stats");
  updateTag("admin:stats");
}
