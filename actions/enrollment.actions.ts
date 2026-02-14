"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";

// Helper to serialize enrollment data
function serializeEnrollment(enrollment: any) {
  return {
    ...enrollment,
    enrollmentFee: Number(enrollment.enrollmentFee),
    createdAt: enrollment.createdAt.toISOString(),
    updatedAt: enrollment.updatedAt?.toISOString(),
    paidAt: enrollment.paidAt?.toISOString(),
    approvedAt: enrollment.approvedAt?.toISOString(),
    rejectedAt: enrollment.rejectedAt?.toISOString(),
    batch: enrollment.batch
      ? {
          ...enrollment.batch,
          price: Number(enrollment.batch.price),
          enrollStart: enrollment.batch.enrollStart.toISOString(),
          enrollEnd: enrollment.batch.enrollEnd.toISOString(),
          createdAt: enrollment.batch.createdAt?.toISOString(),
          updatedAt: enrollment.batch.updatedAt?.toISOString(),
        }
      : null,
    payment: enrollment.payment
      ? {
          ...enrollment.payment,
          amount: Number(enrollment.payment.amount),
          createdAt: enrollment.payment.createdAt.toISOString(),
          updatedAt: enrollment.payment.updatedAt?.toISOString(),
          verifiedAt: enrollment.payment.verifiedAt?.toISOString(),
          paidAt: enrollment.payment.paidAt?.toISOString(),
        }
      : null,
    user: enrollment.user
      ? {
          ...enrollment.user,
          createdAt: enrollment.user.createdAt?.toISOString(),
          updatedAt: enrollment.user.updatedAt?.toISOString(),
        }
      : null,
  };
}

/* =====================================================
   CACHE TAGS + KEY HELPER
===================================================== */
const TAGS = {
  my: "enrollments:my",
  admin: "enrollments:admin",
  batches: "enrollments:batches",
};

function keyFromParams(prefix: string, params: any) {
  return `${prefix}:${JSON.stringify(params ?? {})}`;
}

/* =====================================================
   USER: START ENROLLMENT
===================================================== */
export async function startEnrollmentAction(batchId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!user.isVerified) throw new Error("Verify email first");

  const enrollment = await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found");

    if (!batch.isPublished || !batch.isOpen)
      throw new Error("Enrollment closed");

    const now = new Date();
    if (now < batch.enrollStart || now > batch.enrollEnd) {
      throw new Error("Outside enrollment period");
    }

    if (batch.seats <= 0) throw new Error("No seats left");

    const existing = await tx.enrollment.findFirst({
      where: {
        userId: user.id,
        batchId,
        status: { in: ["PENDING", "PAYMENT_SUBMITTED", "ACTIVE"] },
      },
    });
    if (existing) throw new Error("Already enrolled");

    const seatUpdate = await tx.batch.updateMany({
      where: { id: batchId, seats: { gt: 0 } },
      data: { seats: { decrement: 1 } },
    });
    if (seatUpdate.count === 0) throw new Error("Seat no longer available");

    return tx.enrollment.create({
      data: {
        userId: user.id,
        batchId,
        enrollmentFee: batch.price,
        status: "PENDING",
      },
      include: {
        batch: true,
      },
    });
  });

  // ✅ invalidate caches
  updateTag(TAGS.my);
  updateTag(TAGS.admin);
  updateTag(TAGS.batches);

  revalidatePath("/dashboard/enrollments");
  return { success: true, enrollment: serializeEnrollment(enrollment) };
}

/* =====================================================
   USER: GET MY ENROLLMENTS (CACHED)
===================================================== */
const cachedGetMyEnrollments = unstable_cache(
  async (userId: string) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            enrollStart: true,
            enrollEnd: true,
            isOpen: true,
            isPublished: true,
            price: true,
          },
        },
        payment: true,
      },
    });

    return enrollments.map(serializeEnrollment);
  },
  ["enrollments:my:base"],
  { revalidate: 30, tags: [TAGS.my] },
);

export async function getMyEnrollmentsAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return cachedGetMyEnrollments(user.id);
}

/* =====================================================
   ADMIN: GET ALL ENROLLMENTS WITH PAGINATION & FILTERS (CACHED)
===================================================== */
function cachedGetAllEnrollments(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  batchId?: string;
}) {
  const cacheKey = keyFromParams("enrollments:admin", params);

  return unstable_cache(
    async () => {
      const {
        page = 1,
        pageSize = 10,
        search = "",
        status,
        batchId,
      } = params || {};

      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (search) {
        where.OR = [
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { batch: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      if (status && status !== "all") where.status = status;
      if (batchId && batchId !== "all") where.batchId = batchId;

      const [totalCount, enrollments] = await Promise.all([
        prisma.enrollment.count({ where }),
        prisma.enrollment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            batch: {
              select: {
                id: true,
                name: true,
                price: true,
                enrollStart: true,
                enrollEnd: true,
              },
            },
            payment: true,
          },
          skip,
          take: pageSize,
        }),
      ]);

      return {
        enrollments: enrollments.map(serializeEnrollment),
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

export async function getAllEnrollmentsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  batchId?: string;
}) {
  await requireRole(["ADMIN"]);
  return cachedGetAllEnrollments(params);
}

/* =====================================================
   ADMIN: DELETE ENROLLMENT
===================================================== */
export async function deleteEnrollmentsAction(ids: string[]) {
  await requireRole(["ADMIN"]);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      id: { in: ids },
      status: "ACTIVE",
    },
    include: {
      batch: true,
    },
  });

  for (const enrollment of enrollments) {
    await prisma.batch.update({
      where: { id: enrollment.batchId },
      data: { seats: { increment: 1 } },
    });
  }

  const result = await prisma.enrollment.deleteMany({
    where: { id: { in: ids } },
  });

  // ✅ invalidate caches
  updateTag(TAGS.my);
  updateTag(TAGS.admin);
  updateTag(TAGS.batches);

  revalidatePath("/dashboard/admin/enrollments");
  return { success: true, deletedCount: result.count };
}

/* =====================================================
   ADMIN: GET BATCHES FOR FILTER (CACHED)
===================================================== */
const cachedGetBatchesForFilter = unstable_cache(
  async () => {
    const batches = await prisma.batch.findMany({
      where: { isPublished: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return batches;
  },
  ["enrollments:batchesForFilter"],
  { revalidate: 300, tags: [TAGS.batches] },
);

export async function getBatchesForFilterAction() {
  await requireRole(["ADMIN"]);
  return cachedGetBatchesForFilter();
}
