"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { unstable_cache, updateTag, revalidatePath } from "next/cache";

// Helper to serialize user data
function serializeUser(user: any) {
  return {
    ...user,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}

/* =====================================================
   CACHE HELPERS
===================================================== */

const cachedMyProfile = unstable_cache(
  async (userId: string) => {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return profile ? serializeUser(profile) : null;
  },
  ["user:profile"],
  { revalidate: 60, tags: ["user:profile"] },
);

const cachedUserDashboardStats = unstable_cache(
  async (userId: string) => {
    const now = new Date();

    const [
      totalEnrollments,
      activeEnrollments,
      pendingEnrollments,
      paymentSubmittedEnrollments,
      rejectedEnrollments,
      upcomingClasses,
      totalClasses,
      unreadNotifications,
    ] = await Promise.all([
      prisma.enrollment.count({ where: { userId } }),
      prisma.enrollment.count({ where: { userId, status: "ACTIVE" } }),
      prisma.enrollment.count({ where: { userId, status: "PENDING" } }),
      prisma.enrollment.count({
        where: { userId, status: "PAYMENT_SUBMITTED" },
      }),
      prisma.enrollment.count({ where: { userId, status: "REJECTED" } }),

      prisma.classSession.count({
        where: {
          batch: {
            enrollments: {
              some: { userId, status: "ACTIVE" },
            },
          },
          startsAt: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: "ACTIVE",
        },
      }),

      prisma.classSession.count({
        where: {
          batch: {
            enrollments: {
              some: { userId, status: "ACTIVE" },
            },
          },
          status: "ACTIVE",
        },
      }),

      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    const [recentActivity, nextClass, userData] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          batch: { select: { name: true } },
        },
      }),

      prisma.classSession.findFirst({
        where: {
          batch: {
            enrollments: {
              some: { userId, status: "ACTIVE" },
            },
          },
          startsAt: { gt: now },
          status: "ACTIVE",
        },
        orderBy: { startsAt: "asc" },
        include: {
          batch: { select: { name: true } },
        },
      }),

      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
    ]);

    const daysSinceRegistration = userData
      ? Math.floor(
          (now.getTime() - new Date(userData.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    const years = Math.floor(daysSinceRegistration / 365);
    const months = Math.floor((daysSinceRegistration % 365) / 30);
    const days = daysSinceRegistration % 30;

    let membershipDuration = "";
    if (years > 0)
      membershipDuration += `${years} Year${years > 1 ? "s" : ""} `;
    if (months > 0)
      membershipDuration += `${months} Month${months > 1 ? "s" : ""} `;
    if (days > 0 && years === 0)
      membershipDuration += `${days} Day${days > 1 ? "s" : ""}`;
    if (!membershipDuration) membershipDuration = "Less than a day";

    return {
      stats: {
        totalEnrollments,
        activeEnrollments,
        pendingEnrollments,
        paymentSubmittedEnrollments,
        rejectedEnrollments,
        upcomingClasses,
        totalClasses,
        unreadNotifications,
      },
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        status: a.status,
        batchName: a.batch.name,
        createdAt: a.createdAt.toISOString(),
      })),
      nextClass: nextClass
        ? {
            id: nextClass.id,
            title: nextClass.title,
            startsAt: nextClass.startsAt.toISOString(),
            endsAt: nextClass.endsAt.toISOString(),
            meetingUrl: nextClass.meetingUrl,
            batchName: nextClass.batch.name,
          }
        : null,
      membership: {
        registeredAt: userData?.createdAt.toISOString(),
        duration: membershipDuration,
      },
    };
  },
  ["user:dashboard:stats"],
  { revalidate: 30, tags: ["user:dashboard:stats"] },
);

/* =====================================================
   USER: UPDATE PROFILE
===================================================== */

export async function updateProfileAction(data: {
  name?: string;
  phone?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  // invalidate caches for this user
  updateTag("user:profile");
  updateTag("user:dashboard:stats");

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/profile");
  return { success: true, user: serializeUser(updatedUser) };
}

/* =====================================================
   USER: CHANGE PASSWORD
===================================================== */

export async function changePasswordAction(
  oldPassword: string,
  newPassword: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const exist = await prisma.user.findUnique({ where: { id: user.id } });
  if (!exist) throw new Error("Unauthorized");

  if (!exist.isVerified) {
    throw new Error("Please verify your email first");
  }

  const ok = await verifyPassword(oldPassword, exist.password);
  if (!ok) throw new Error("Wrong password");

  const hash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: exist.id },
      data: { password: hash },
    });

    await tx.userSession.deleteMany({
      where: { userId: exist.id },
    });

    return true;
  });

  // stats/profile may show session-related info in future; keep invalidation
  updateTag("user:profile");
  updateTag("user:dashboard:stats");

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/admin/profile");
  return { success: true, message: "Password changed successfully" };
}

/* =====================================================
   USER: GET MY PROFILE
===================================================== */

export async function getMyProfileAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return cachedMyProfile(user.id);
}

/* =====================================================
   USER: GET DASHBOARD STATS
===================================================== */

export async function getUserDashboardStatsAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return cachedUserDashboardStats(user.id);
}
