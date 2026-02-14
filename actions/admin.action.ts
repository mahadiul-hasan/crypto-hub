"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { hashPassword } from "@/lib/password";
import { unstable_cache, updateTag, revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getEmailStatistics } from "@/lib/email-quota";

// Helper to serialize user data
function serializeUser(user: any) {
  return {
    ...user,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}

// Helper to serialize enrollment data
function serializeEnrollment(enrollment: any) {
  return {
    ...enrollment,
    enrollmentFee: Number(enrollment.enrollmentFee),
    createdAt: enrollment.createdAt?.toISOString(),
    updatedAt: enrollment.updatedAt?.toISOString(),
    paidAt: enrollment.paidAt?.toISOString(),
    approvedAt: enrollment.approvedAt?.toISOString(),
    rejectedAt: enrollment.rejectedAt?.toISOString(),
    user: enrollment.user
      ? {
          ...enrollment.user,
          createdAt: enrollment.user.createdAt?.toISOString(),
          updatedAt: enrollment.user.updatedAt?.toISOString(),
        }
      : null,
    batch: enrollment.batch
      ? {
          ...enrollment.batch,
          price: Number(enrollment.batch.price),
          enrollStart: enrollment.batch.enrollStart?.toISOString(),
          enrollEnd: enrollment.batch.enrollEnd?.toISOString(),
          createdAt: enrollment.batch.createdAt?.toISOString(),
          updatedAt: enrollment.batch.updatedAt?.toISOString(),
        }
      : null,
  };
}

// Helper to serialize batch data
function serializeBatch(batch: any) {
  return {
    ...batch,
    price: Number(batch.price),
    enrollStart: batch.enrollStart?.toISOString(),
    enrollEnd: batch.enrollEnd?.toISOString(),
    createdAt: batch.createdAt?.toISOString(),
    updatedAt: batch.updatedAt?.toISOString(),
    _count: batch._count,
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
   ADMIN: CREATE ADMIN USER
===================================================== */

export async function createAdminAction(data: {
  name: string;
  email: string;
  password: string;
}) {
  await requireRole(["ADMIN"]);

  const exists = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (exists) throw new Error("Email already exists");

  const hash = await hashPassword(data.password);

  const response = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hash,
      role: "ADMIN",
      isActive: true,
      isVerified: true,
    },
  });

  // invalidate caches
  updateTag("users:admin:list");
  updateTag("admin:stats");

  revalidatePath("/dashboard/admin/users");

  return { success: true, message: `Admin created with ${response.email}` };
}

/* =====================================================
   ADMIN: GET ALL USERS WITH PAGINATION & FILTERS
===================================================== */

const cachedAllUsers = unstable_cache(
  async (
    _paramsKey: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      role?: string;
      status?: string;
    },
  ) => {
    const { page = 1, pageSize = 10, search = "", role, status } = params || {};
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "all") {
      where.role = role;
    }

    if (status && status !== "all") {
      where.isActive = status === "active";
    }

    const totalCount = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      skip,
      take: pageSize,
    });

    return {
      users: users.map(serializeUser),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  },
  ["users:admin:list"],
  { revalidate: 30, tags: ["users:admin:list", "admin:stats"] },
);

export async function getAllUsersAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  await requireRole(["ADMIN"]);
  const key = stableKey(params || {});
  return cachedAllUsers(key, params);
}

/* =====================================================
   ADMIN: DELETE USERS (Cannot delete self)
===================================================== */

export async function deleteUsersAction(userIds: string[]) {
  const user = await getCurrentUser();
  await requireRole(["ADMIN"]);

  const currentUserId = user?.id;

  if (currentUserId && userIds.includes(currentUserId)) {
    throw new Error("You cannot delete your own account");
  }

  const idsToDelete = userIds.filter((id) => id !== currentUserId);

  if (idsToDelete.length === 0) {
    throw new Error("No valid users to delete");
  }

  await prisma.user.deleteMany({
    where: {
      id: { in: idsToDelete },
    },
  });

  // invalidate caches
  updateTag("users:admin:list");
  updateTag("admin:stats");

  revalidatePath("/dashboard/admin/users");
  return { success: true, deletedCount: idsToDelete.length };
}

/* =====================================================
   ADMIN: UPDATE USER ROLE (Cannot change own role)
===================================================== */

export async function updateUserRoleAction(userId: string, newRole: string) {
  const user = await getCurrentUser();
  await requireRole(["ADMIN"]);

  const currentUserId = user?.id;

  if (currentUserId === userId) {
    throw new Error("You cannot change your own role");
  }

  const validRoles = ["ADMIN", "STUDENT"];
  if (!validRoles.includes(newRole)) {
    throw new Error("Invalid role");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole as any },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
    },
  });

  // invalidate caches
  updateTag("users:admin:list");
  updateTag("admin:stats");

  revalidatePath("/dashboard/admin/users");
  return { success: true, user: serializeUser(updatedUser) };
}

/* =====================================================
   ADMIN: TOGGLE USER STATUS (Cannot deactivate self)
===================================================== */

export async function toggleUserStatusAction(userId: string, active: boolean) {
  const user = await getCurrentUser();
  await requireRole(["ADMIN"]);

  const currentUserId = user?.id;

  if (currentUserId === userId && !active) {
    throw new Error("You cannot deactivate your own account");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: active },
  });

  // invalidate caches
  updateTag("users:admin:list");
  updateTag("admin:stats");

  revalidatePath("/dashboard/admin/users");
  return { success: true, user: serializeUser(updatedUser) };
}

/* =====================================================
   ADMIN: GET DASHBOARD STATS
===================================================== */

const cachedAdminStats = unstable_cache(
  async () => {
    const [
      users,
      batches,
      enrollments,
      payments,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      activeEnrollments,
      pendingEnrollments,
      paymentSubmittedEnrollments,
      expiredEnrollments,
      rejectedEnrollments,
      recentEnrollments,
      recentPayments,
      recentUsers,
      emailStats,
      expireCandidates,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.batch.count(),
      prisma.enrollment.count(),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "APPROVED" } }),
      prisma.payment.count({ where: { status: "REJECTED" } }),

      prisma.enrollment.count({ where: { status: "ACTIVE" } }),
      prisma.enrollment.count({ where: { status: "PENDING" } }),
      prisma.enrollment.count({ where: { status: "PAYMENT_SUBMITTED" } }),
      prisma.enrollment.count({ where: { status: "EXPIRED" } }),
      prisma.enrollment.count({ where: { status: "REJECTED" } }),

      prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          batch: { select: { name: true, price: true } },
        },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          enrollment: {
            include: {
              user: { select: { name: true } },
              batch: { select: { name: true } },
            },
          },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          isVerified: true,
        },
      }),
      getEmailStatistics(),

      prisma.classSession.count({
        where: {
          endsAt: { lt: new Date() },
          status: "ACTIVE",
        },
      }),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentEnrollmentsForChart = await prisma.enrollment.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });

    const enrollmentTrends = recentEnrollmentsForChart.reduce(
      (acc, enrollment) => {
        const month = enrollment.createdAt.toLocaleString("default", {
          month: "short",
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const formattedEnrollmentTrends = Object.entries(enrollmentTrends).map(
      ([month, count]) => ({ month, enrollments: count }),
    );

    const recentPaymentsForChart = await prisma.payment.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, status: "APPROVED" },
      select: { createdAt: true, amount: true },
    });

    const paymentTrends = recentPaymentsForChart.reduce(
      (acc, payment) => {
        const month = payment.createdAt.toLocaleString("default", {
          month: "short",
        });
        if (!acc[month]) acc[month] = { count: 0, total: 0 };
        acc[month].count += 1;
        acc[month].total += Number(payment.amount);
        return acc;
      },
      {} as Record<string, { count: number; total: number }>,
    );

    const formattedPaymentTrends = Object.entries(paymentTrends).map(
      ([month, data]) => ({
        month,
        payments: data.count,
        total: data.total,
      }),
    );

    const topBatches = await prisma.batch.findMany({
      take: 5,
      where: { isPublished: true },
      include: {
        _count: {
          select: {
            enrollments: { where: { status: "ACTIVE" } },
            sessions: true,
          },
        },
      },
      orderBy: {
        enrollments: { _count: "desc" },
      },
    });

    const serializedRecentEnrollments = recentEnrollments.map((e) => ({
      ...e,
      enrollmentFee: Number(e.enrollmentFee),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt?.toISOString(),
      paidAt: e.paidAt?.toISOString(),
      approvedAt: e.approvedAt?.toISOString(),
      rejectedAt: e.rejectedAt?.toISOString(),
      batch: e.batch ? { ...e.batch, price: Number(e.batch.price) } : null,
    }));

    const serializedRecentPayments = recentPayments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt?.toISOString(),
      verifiedAt: p.verifiedAt?.toISOString(),
      paidAt: p.paidAt?.toISOString(),
      enrollment: p.enrollment
        ? { ...p.enrollment, enrollmentFee: Number(p.enrollment.enrollmentFee) }
        : null,
    }));

    const serializedRecentUsers = recentUsers.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));

    const serializedTopBatches = topBatches.map(serializeBatch);

    const serializedEmailStats = {
      systemQuota: {
        today: emailStats.systemQuota.today,
        yesterday: emailStats.systemQuota.yesterday,
        limit: emailStats.systemQuota.limit,
        percentageUsed: Math.min(emailStats.systemQuota.percentageUsed, 100),
      },
      topUsers: emailStats.topUsers.map((counter) => ({
        ...counter,
        date: counter.date.toISOString(),
        createdAt: counter.createdAt?.toISOString(),
        updatedAt: counter.updatedAt?.toISOString(),
      })),
      recentEmails: emailStats.recentEmails.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      totalEmails: emailStats.totalEmails,
      userLimit: emailStats.userLimit,
    };

    return {
      users,
      batches,
      enrollments,
      payments,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      enrollmentStatus: {
        ACTIVE: activeEnrollments,
        PENDING: pendingEnrollments,
        PAYMENT_SUBMITTED: paymentSubmittedEnrollments,
        EXPIRED: expiredEnrollments,
        REJECTED: rejectedEnrollments,
      },
      recentEnrollments: serializedRecentEnrollments,
      recentPayments: serializedRecentPayments,
      recentUsers: serializedRecentUsers,
      emailStats: serializedEmailStats,
      enrollmentTrends: formattedEnrollmentTrends,
      paymentTrends: formattedPaymentTrends,
      topBatches: serializedTopBatches,
      expireCandidates,
    };
  },
  ["admin:stats"],
  { revalidate: 30, tags: ["admin:stats"] },
);

export async function getAdminStatsAction() {
  await requireRole(["ADMIN"]);
  return cachedAdminStats();
}

/* =====================================================
   ADMIN: GET ALL ENROLLMENTS
===================================================== */

const cachedAllEnrollments = unstable_cache(
  async () => {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: true,
        batch: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return enrollments.map(serializeEnrollment);
  },
  ["enrollments:admin:list"],
  { revalidate: 30, tags: ["enrollments:admin:list", "admin:stats"] },
);

export async function getAllEnrollmentsAction() {
  await requireRole(["ADMIN"]);
  return cachedAllEnrollments();
}
