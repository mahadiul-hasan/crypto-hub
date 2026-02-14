"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";

// Helper to serialize notification data
function serializeNotification(notification: any) {
  return {
    ...notification,
    createdAt: notification.createdAt?.toISOString(),
    updatedAt: notification.updatedAt?.toISOString(),
    readAt: notification.readAt?.toISOString(),
    batch: notification.batch
      ? {
          ...notification.batch,
          createdAt: notification.batch.createdAt?.toISOString(),
          updatedAt: notification.batch.updatedAt?.toISOString(),
        }
      : null,
  };
}

/* =====================================================
   CACHE TAGS + KEY HELPER
===================================================== */
const TAGS = {
  my: "notifications:my",
  admin: "notifications:admin",
};

function keyFromParams(prefix: string, params: any) {
  return `${prefix}:${JSON.stringify(params ?? {})}`;
}

/* =====================================================
   GET MY NOTIFICATIONS (CACHED)
===================================================== */
function cachedGetMyNotifications(userId: string, limit: number) {
  const cacheKey = keyFromParams("notifications:my", { userId, limit });

  return unstable_cache(
    async () => {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          batch: { select: { id: true, name: true } },
        },
      });

      return notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        batch: n.batch,
        isRead: !!n.readAt,
        readAt: n.readAt?.toISOString() ?? null,
      }));
    },
    [cacheKey],
    { revalidate: 15, tags: [TAGS.my] },
  )();
}

export async function getMyNotificationsAction(limit = 30) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return cachedGetMyNotifications(user.id, limit);
}

/* =====================================================
   MARK ONE AS READ (INVALIDATE)
===================================================== */
export async function markNotificationReadAction(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const n = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true, readAt: true },
  });

  if (!n) throw new Error("Not found");
  if (n.userId !== user.id) throw new Error("Forbidden");
  if (n.readAt) return true;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  // ✅ invalidate caches
  updateTag(TAGS.my);
  updateTag(TAGS.admin);

  revalidatePath("/dashboard/notifications");
  return true;
}

/* =====================================================
   MARK ALL AS READ (INVALIDATE)
===================================================== */
export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  // ✅ invalidate caches
  updateTag(TAGS.my);
  updateTag(TAGS.admin);

  revalidatePath("/dashboard/notifications");
  return true;
}

/* =====================================================
   ADMIN: GET ALL NOTIFICATIONS WITH PAGINATION & FILTERS (CACHED)
===================================================== */
function cachedGetAllNotifications(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  isRead?: string;
  daysOld?: number;
}) {
  const cacheKey = keyFromParams("notifications:admin", params);

  return unstable_cache(
    async () => {
      const {
        page = 1,
        pageSize = 10,
        search = "",
        userId,
        isRead,
        daysOld = 7,
      } = params || {};

      const skip = (page - 1) * pageSize;

      const where: any = {};

      // show last X days => createdAt >= cutoffDate
      if (daysOld > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        where.createdAt = { gte: cutoffDate };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { body: { contains: search, mode: "insensitive" } },
        ];
      }

      if (
        userId &&
        userId !== "all" &&
        userId !== "undefined" &&
        userId !== ""
      ) {
        where.userId = userId;
      }

      if (
        isRead &&
        isRead !== "all" &&
        isRead !== "undefined" &&
        isRead !== ""
      ) {
        if (isRead === "read") where.readAt = { not: null };
        if (isRead === "unread") where.readAt = null;
      }

      const [totalCount, notifications] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            batch: {
              select: { id: true, name: true },
            },
          },
          skip,
          take: pageSize,
        }),
      ]);

      return {
        notifications: notifications.map(serializeNotification),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    },
    [cacheKey],
    { revalidate: 30, tags: [TAGS.admin] },
  )();
}

export async function getAllNotificationsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  isRead?: string;
  daysOld?: number;
}) {
  await requireRole(["ADMIN"]);
  return cachedGetAllNotifications(params);
}

/* =====================================================
   ADMIN: DELETE OLD NOTIFICATIONS (INVALIDATE)
===================================================== */
export async function deleteOldNotificationsAction(daysOld: number = 7) {
  await requireRole(["ADMIN"]);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lte: cutoffDate },
    },
  });

  // ✅ invalidate caches
  updateTag(TAGS.admin);
  updateTag(TAGS.my);

  revalidatePath("/dashboard/admin/notifications");
  return {
    success: true,
    deletedCount: result.count,
    message: `Deleted ${result.count} notifications older than ${daysOld} days`,
  };
}

/* =====================================================
   ADMIN: DELETE SELECTED NOTIFICATIONS (INVALIDATE)
===================================================== */
export async function deleteNotificationsAction(ids: string[]) {
  await requireRole(["ADMIN"]);

  const result = await prisma.notification.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  // ✅ invalidate caches
  updateTag(TAGS.admin);
  updateTag(TAGS.my);

  revalidatePath("/dashboard/admin/notifications");
  return { success: true, deletedCount: result.count };
}

/* =====================================================
   ADMIN: CLEANUP JOB - Run periodically (INVALIDATE)
===================================================== */
export async function cleanupOldNotificationsAction(daysOld: number = 7) {
  await requireRole(["ADMIN"]);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lte: cutoffDate },
    },
  });

  // ✅ invalidate caches
  updateTag(TAGS.admin);
  updateTag(TAGS.my);

  return {
    success: true,
    deletedCount: result.count,
    message: `Cleaned up ${result.count} notifications older than ${daysOld} days`,
  };
}
