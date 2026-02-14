"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/auth";
import { unstable_cache, updateTag, revalidatePath } from "next/cache";
import { SessionStatus } from "@/lib/generated/prisma/enums";

// Helper to serialize class session data
function serializeClassSession(session: any) {
  return {
    ...session,
    startsAt: session.startsAt?.toISOString(),
    endsAt: session.endsAt?.toISOString(),
    createdAt: session.createdAt?.toISOString(),
    updatedAt: session.updatedAt?.toISOString(),
    batch: session.batch
      ? {
          ...session.batch,
          price: Number(session.batch.price),
          enrollStart: session.batch.enrollStart?.toISOString(),
          enrollEnd: session.batch.enrollEnd?.toISOString(),
          createdAt: session.batch.createdAt?.toISOString(),
          updatedAt: session.batch.updatedAt?.toISOString(),
        }
      : null,
  };
}

// stable stringify for cache keys (avoid object-order issues)
function stableKey(input: unknown) {
  if (input === undefined) return "undefined";
  if (input === null) return "null";
  if (typeof input !== "object") return String(input);

  const obj = input as Record<string, any>;
  const keys = Object.keys(obj).sort();
  const normalized: Record<string, any> = {};
  for (const k of keys) normalized[k] = obj[k];
  return JSON.stringify(normalized);
}

/* =====================================================
   ADMIN: GET ALL CLASSES WITH PAGINATION & FILTERS
===================================================== */

const cachedAllClasses = unstable_cache(
  async (
    _paramsKey: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      batchId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      batchId,
      status,
      startDate,
      endDate,
    } = params || {};

    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { batch: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (batchId && batchId !== "all") {
      where.batchId = batchId;
    }

    if (status && status !== "all") {
      where.status = status as SessionStatus;
    }

    if (startDate || endDate) {
      where.startsAt = {};
      if (startDate) where.startsAt.gte = new Date(startDate);
      if (endDate) where.startsAt.lte = new Date(endDate);
    }

    const totalCount = await prisma.classSession.count({ where });

    const classes = await prisma.classSession.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      skip,
      take: pageSize,
    });

    const serializedClasses = classes.map(serializeClassSession);

    // batches for filter dropdown
    const batches = await prisma.batch.findMany({
      where: { sessions: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return {
      classes: serializedClasses,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      filters: { batches },
    };
  },
  ["classes:admin:list"],
  { revalidate: 30, tags: ["classes:admin:list", "classes:filters:batches"] },
);

export async function getAllClassesAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  batchId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  await requireRole(["ADMIN"]);
  const key = stableKey(params || {});
  return cachedAllClasses(key, params);
}

/* =====================================================
   ADMIN: CREATE CLASS
===================================================== */
export async function createClassAction(data: {
  batchId: string;
  title: string;
  meetingUrl: string;
  startsAt: Date;
  endsAt: Date;
}) {
  await requireRole(["ADMIN"]);

  if (data.endsAt <= data.startsAt) throw new Error("Invalid time range");

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({
      where: { id: data.batchId },
    });
    if (!batch) throw new Error("Batch not found");

    const session = await tx.classSession.create({
      data: {
        batchId: data.batchId,
        title: data.title,
        meetingUrl: data.meetingUrl,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        status: "ACTIVE",
      },
      include: {
        batch: { select: { name: true } },
      },
    });

    // notify ACTIVE students
    const students = await tx.enrollment.findMany({
      where: { batchId: data.batchId, status: "ACTIVE" },
      select: { userId: true },
    });

    if (students.length) {
      await tx.notification.createMany({
        data: students.map((s) => ({
          userId: s.userId,
          title: "New Class Scheduled",
          body: `${data.title} — ${data.startsAt.toLocaleString()} (Meeting link in schedule)`,
          batchId: data.batchId,
        })),
      });
    }

    return session;
  });

  // invalidate caches
  updateTag("classes:admin:list");
  updateTag("classes:filters:batches");
  updateTag(`classes:batch:${data.batchId}`);
  updateTag("classes:stats");

  revalidatePath("/dashboard/admin/classes");

  return { success: true, class: serializeClassSession(result) };
}

/* =====================================================
   ADMIN: UPDATE CLASS
===================================================== */
export async function updateClassAction(
  id: string,
  data: {
    title?: string;
    meetingUrl?: string;
    startsAt?: Date;
    endsAt?: Date;
    status?: SessionStatus;
  },
) {
  await requireRole(["ADMIN"]);

  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
    throw new Error("Invalid time range");
  }

  const session = await prisma.classSession.update({
    where: { id },
    data,
    include: {
      batch: { select: { id: true, name: true } },
    },
  });

  // invalidate caches
  updateTag("classes:admin:list");
  updateTag("classes:stats");
  updateTag(`class:${id}`);
  if (session.batch?.id) updateTag(`classes:batch:${session.batch.id}`);

  revalidatePath("/dashboard/admin/classes");
  return { success: true, class: serializeClassSession(session) };
}

/* =====================================================
   ADMIN: DELETE CLASSES
===================================================== */
export async function deleteClassesAction(ids: string[]) {
  await requireRole(["ADMIN"]);

  // find batchIds before delete (so we can invalidate per-batch caches)
  const sessions = await prisma.classSession.findMany({
    where: { id: { in: ids } },
    select: { id: true, batchId: true },
  });

  const result = await prisma.classSession.deleteMany({
    where: { id: { in: ids } },
  });

  updateTag("classes:admin:list");
  updateTag("classes:stats");
  updateTag("classes:filters:batches");

  for (const s of sessions) {
    updateTag(`class:${s.id}`);
    updateTag(`classes:batch:${s.batchId}`);
  }

  revalidatePath("/dashboard/admin/classes");
  return { success: true, deletedCount: result.count };
}

/* =====================================================
   ADMIN: EXPIRE CLASS
===================================================== */
export async function expireClassAction(id: string) {
  await requireRole(["ADMIN"]);

  const session = await prisma.classSession.update({
    where: { id },
    data: { status: "EXPIRED" },
    include: {
      batch: { select: { id: true, name: true } },
    },
  });

  updateTag("classes:admin:list");
  updateTag("classes:stats");
  updateTag(`class:${id}`);
  if (session.batch?.id) updateTag(`classes:batch:${session.batch.id}`);

  revalidatePath("/dashboard/admin/classes");
  return { success: true, class: serializeClassSession(session) };
}

/* =====================================================
   STUDENT: VIEW MY CLASSES
===================================================== */

const cachedMyClasses = unstable_cache(
  async (userId: string) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: "ACTIVE" },
      select: { batchId: true },
    });

    const batchIds = enrollments.map((e) => e.batchId);
    if (!batchIds.length) return [];

    const classes = await prisma.classSession.findMany({
      where: {
        batchId: { in: batchIds },
        status: "ACTIVE",
      },
      orderBy: { startsAt: "asc" },
      include: {
        batch: { select: { name: true } },
      },
    });

    return classes.map(serializeClassSession);
  },
  ["classes:user"],
  { revalidate: 30, tags: ["classes:user:LIST"] },
);

export async function getMyClassesAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return cachedMyClasses(user.id);
}

/* =====================================================
   ADMIN: VIEW CLASSES BY BATCH
===================================================== */

const cachedBatchClasses = unstable_cache(
  async (batchId: string) => {
    const classes = await prisma.classSession.findMany({
      where: { batchId },
      orderBy: { startsAt: "desc" },
      include: {
        batch: { select: { name: true } },
      },
    });

    return classes.map(serializeClassSession);
  },
  ["classes:batch"],
  { revalidate: 30, tags: ["classes:admin:list"] },
);

export async function getBatchClassesAction(batchId: string) {
  await requireRole(["ADMIN"]);
  return cachedBatchClasses(batchId);
}

/* =====================================================
   ADMIN: GET BATCHES FOR FILTER
===================================================== */

const cachedBatchesForClassFilter = unstable_cache(
  async () => {
    const batches = await prisma.batch.findMany({
      where: { isPublished: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return batches;
  },
  ["classes:filters:batches"],
  { revalidate: 300, tags: ["classes:filters:batches"] },
);

export async function getBatchesForClassFilterAction() {
  await requireRole(["ADMIN"]);
  return cachedBatchesForClassFilter();
}

/* =====================================================
   SYSTEM: AUTO EXPIRE JOB
===================================================== */
export async function autoExpireClassesAction() {
  const now = new Date();

  const result = await prisma.classSession.updateMany({
    where: { endsAt: { lt: now }, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });

  // invalidate caches that depend on status/times
  updateTag("classes:admin:list");
  updateTag("classes:stats");
  updateTag("admin:stats");

  return {
    success: true,
    expiredCount: result.count,
    message: `Expired ${result.count} classes`,
  };
}

/* =====================================================
   ADMIN: GET CLASS STATISTICS
===================================================== */

const cachedClassStats = unstable_cache(
  async () => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisWeek = new Date(new Date().setDate(new Date().getDate() - 7));
    const thisMonth = new Date(new Date().setMonth(new Date().getMonth() - 1));

    const [
      totalClasses,
      activeClasses,
      expiredClasses,
      upcomingClasses,
      todayClasses,
      thisWeekClasses,
      thisMonthClasses,
    ] = await Promise.all([
      prisma.classSession.count(),
      prisma.classSession.count({ where: { status: "ACTIVE" } }),
      prisma.classSession.count({ where: { status: "EXPIRED" } }),
      prisma.classSession.count({
        where: { status: "ACTIVE", startsAt: { gt: new Date() } },
      }),
      prisma.classSession.count({
        where: {
          startsAt: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.classSession.count({
        where: { startsAt: { gte: thisWeek } },
      }),
      prisma.classSession.count({
        where: { startsAt: { gte: thisMonth } },
      }),
    ]);

    return {
      total: totalClasses,
      active: activeClasses,
      expired: expiredClasses,
      upcoming: upcomingClasses,
      today: todayClasses,
      thisWeek: thisWeekClasses,
      thisMonth: thisMonthClasses,
    };
  },
  ["classes:stats"],
  { revalidate: 60, tags: ["classes:stats"] },
);

export async function getClassStatisticsAction() {
  await requireRole(["ADMIN"]);
  return cachedClassStats();
}
