"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { emailQueue } from "@/lib/email-queue";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { PaymentMethod } from "@/lib/generated/prisma/enums";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";

// Helper to serialize payment data
function serializePayment(payment: any) {
  return {
    ...payment,
    amount: Number(payment.amount),
    createdAt: payment.createdAt?.toISOString(),
    updatedAt: payment.updatedAt?.toISOString(),
    verifiedAt: payment.verifiedAt?.toISOString(),
    paidAt: payment.paidAt?.toISOString(),
    enrollment: payment.enrollment
      ? {
          ...payment.enrollment,
          enrollmentFee: Number(payment.enrollment.enrollmentFee),
          createdAt: payment.enrollment.createdAt?.toISOString(),
          updatedAt: payment.enrollment.updatedAt?.toISOString(),
          paidAt: payment.enrollment.paidAt?.toISOString(),
          approvedAt: payment.enrollment.approvedAt?.toISOString(),
          rejectedAt: payment.enrollment.rejectedAt?.toISOString(),
          user: payment.enrollment.user,
          batch: payment.enrollment.batch
            ? {
                ...payment.enrollment.batch,
                price: Number(payment.enrollment.batch.price),
                enrollStart:
                  payment.enrollment.batch.enrollStart?.toISOString(),
                enrollEnd: payment.enrollment.batch.enrollEnd?.toISOString(),
                createdAt: payment.enrollment.batch.createdAt?.toISOString(),
                updatedAt: payment.enrollment.batch.updatedAt?.toISOString(),
              }
            : null,
        }
      : null,
    verifiedBy: payment.verifiedBy,
  };
}

/* =====================================================
   CACHE TAGS + KEY HELPER
===================================================== */
const TAGS = {
  paymentsAdmin: "payments:admin",
  paymentsPending: "payments:pending",
  paymentsStats: "payments:stats",
  enrollments: "enrollments",
  notifications: "notifications",
};

function keyFromParams(prefix: string, params: any) {
  return `${prefix}:${JSON.stringify(params ?? {})}`;
}

/* =====================================================
   USER: SUBMIT PAYMENT INFO
===================================================== */
export async function submitPaymentAction(data: {
  enrollmentId: string;
  trxId: string;
  method: PaymentMethod;
  senderNumber: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        batch: true,
        payment: true,
        user: true,
      },
    });

    if (!enrollment) throw new Error("Enrollment not found");
    if (enrollment.userId !== user.id) throw new Error("Forbidden");

    if (enrollment.status !== "PENDING") {
      throw new Error("Invalid state. Payment already submitted or processed.");
    }

    if (!enrollment.batch.isOpen) {
      throw new Error("This batch is no longer accepting enrollments.");
    }

    if (enrollment.batch.seats <= 0) {
      throw new Error("No seats left in this batch.");
    }

    const now = new Date();
    const enrollStart = new Date(enrollment.batch.enrollStart);
    const enrollEnd = new Date(enrollment.batch.enrollEnd);

    const isBeforeStart = now < enrollStart;
    const isAfterEnd = now > enrollEnd;

    const trxExists = await tx.payment.findUnique({
      where: { trxId: data.trxId },
    });
    if (trxExists) throw new Error("Transaction already used");

    if (enrollment.payment) throw new Error("Payment already exists");

    let paymentStatus: "PENDING" | "REJECTED" = "PENDING";
    let rejectionReason: string | null = null;

    if (isBeforeStart) {
      paymentStatus = "REJECTED";
      rejectionReason = `Payment submitted before enrollment period. Enrollment starts on ${enrollStart.toLocaleDateString()}`;
    } else if (isAfterEnd) {
      paymentStatus = "REJECTED";
      rejectionReason = `Payment submitted after enrollment period ended on ${enrollEnd.toLocaleDateString()}`;
    }

    const payment = await tx.payment.create({
      data: {
        enrollmentId: enrollment.id,
        trxId: data.trxId,
        method: data.method,
        senderNumber: data.senderNumber,
        amount: enrollment.enrollmentFee,
        status: paymentStatus,
        paidAt: new Date(),
        verifiedAt: paymentStatus === "REJECTED" ? new Date() : null,
        verifiedById: null, // system
      },
    });

    const feeAmount = Number(enrollment.enrollmentFee);

    if (paymentStatus === "REJECTED") {
      await tx.batch.update({
        where: { id: enrollment.batchId },
        data: { seats: { increment: 1 } },
      });

      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectReason: rejectionReason,
        },
      });

      await tx.notification.create({
        data: {
          userId: enrollment.userId,
          title: "Payment Auto-Rejected",
          body:
            rejectionReason ||
            "Your payment was automatically rejected due to enrollment period rules.",
          batchId: enrollment.batchId,
        },
      });

      const html = EMAIL_TEMPLATES.paymentRejected(
        enrollment.user.name,
        feeAmount,
        payment.id,
        rejectionReason || "Enrollment period has ended",
      );

      await emailQueue.add({
        type: "PAYMENT_NOTIFICATION",
        userId: enrollment.user.id,
        email: enrollment.user.email,
        subject: "Payment Auto-Rejected",
        html,
        isAdmin: false,
      });
    } else {
      await tx.enrollment.updateMany({
        where: { id: enrollment.id, status: "PENDING" },
        data: { status: "PAYMENT_SUBMITTED", paidAt: new Date() },
      });

      const admins = await tx.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      await tx.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title: "New Payment Submitted",
          body: `${user.name} submitted payment for ${enrollment.batch.name}.`,
          batchId: enrollment.batchId,
        })),
      });

      const html = EMAIL_TEMPLATES.paymentSubmitted(
        enrollment.user.name,
        feeAmount,
        payment.id,
        enrollment.batch.name,
      );

      await emailQueue.add({
        type: "PAYMENT_NOTIFICATION",
        userId: enrollment.user.id,
        email: enrollment.user.email,
        subject: "New Payment submitted",
        html,
        isAdmin: true,
      });
    }

    return {
      payment,
      autoRejected: paymentStatus === "REJECTED",
      rejectionReason,
    };
  });

  // ✅ invalidate caches
  updateTag(TAGS.paymentsAdmin);
  updateTag(TAGS.paymentsPending);
  updateTag(TAGS.paymentsStats);
  updateTag(TAGS.enrollments);
  updateTag(TAGS.notifications);

  revalidatePath("/dashboard/enrollments");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/admin/payments");
  revalidatePath("/dashboard/admin/enrollments");
  revalidatePath("/dashboard/admin/notifications");

  if (result.autoRejected) {
    return {
      success: true,
      autoRejected: true,
      message:
        result.rejectionReason ||
        "Payment auto-rejected due to enrollment period",
      payment: serializePayment(result.payment),
    };
  }

  return { success: true, payment: serializePayment(result.payment) };
}

/* =====================================================
   ADMIN: APPROVE PAYMENT
===================================================== */
export async function approvePaymentAction(enrollmentId: string) {
  const admin = await requireRole(["ADMIN"]);

  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: true, batch: true, payment: true },
    });

    if (!enrollment) throw new Error("Enrollment not found");
    if (!enrollment.payment) throw new Error("No payment found");

    if (enrollment.status !== "PAYMENT_SUBMITTED") {
      throw new Error("Invalid state");
    }

    if (enrollment.payment.status !== "PENDING") {
      throw new Error("Payment already verified");
    }

    const now = new Date();
    const enrollEnd = new Date(enrollment.batch.enrollEnd);
    const isEnrollmentPeriodEnded = now > enrollEnd;

    if (isEnrollmentPeriodEnded) {
      const payment = await tx.payment.update({
        where: { id: enrollment.payment.id },
        data: {
          status: "REJECTED",
          verifiedById: admin.id,
          verifiedAt: new Date(),
        },
        include: {
          enrollment: {
            include: { user: true, batch: true },
          },
        },
      });

      await tx.batch.update({
        where: { id: enrollment.batchId },
        data: { seats: { increment: 1 } },
      });

      const rejectionReason = `Auto-rejected by system: Enrollment period ended on ${enrollEnd.toLocaleDateString()}`;
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectReason: rejectionReason,
        },
      });

      await tx.notification.create({
        data: {
          userId: enrollment.userId,
          title: "Payment Auto-Rejected",
          body: `Your payment was auto-rejected because the enrollment period has ended.`,
          batchId: enrollment.batchId,
        },
      });

      await tx.notification.create({
        data: {
          userId: admin.id,
          title: "⚠️ Auto-Rejected Payment",
          body: `Payment for ${enrollment.batch.name} was auto-rejected due to ended enrollment period.`,
          batchId: enrollment.batchId,
        },
      });

      return { payment, autoRejected: true };
    }

    const payment = await tx.payment.update({
      where: { id: enrollment.payment.id },
      data: {
        status: "APPROVED",
        verifiedById: admin.id,
        verifiedAt: new Date(),
      },
      include: {
        enrollment: {
          include: { user: true, batch: true },
        },
      },
    });

    await tx.enrollment.updateMany({
      where: { id: enrollment.id, status: "PAYMENT_SUBMITTED" },
      data: { status: "ACTIVE", approvedAt: new Date() },
    });

    await tx.notification.create({
      data: {
        userId: enrollment.userId,
        title: "Enrollment Approved",
        body: `Your payment for ${enrollment.batch.name} has been approved. You now have access.`,
        batchId: enrollment.batchId,
      },
    });

    const feeAmount = Number(enrollment.payment.amount);

    const html = EMAIL_TEMPLATES.paymentApproved(
      enrollment.user.name,
      feeAmount,
      enrollment.payment.id,
    );

    await emailQueue.add({
      type: "PAYMENT_NOTIFICATION",
      userId: enrollment.user.id,
      email: enrollment.user.email,
      subject: "Payment Approved",
      html,
      isAdmin: false,
    });

    return { payment, autoRejected: false };
  });

  // ✅ invalidate caches
  updateTag(TAGS.paymentsAdmin);
  updateTag(TAGS.paymentsPending);
  updateTag(TAGS.paymentsStats);
  updateTag(TAGS.enrollments);
  updateTag(TAGS.notifications);

  revalidatePath("/dashboard/admin/payments");
  revalidatePath("/dashboard/admin/enrollments");
  revalidatePath("/dashboard/admin/notifications");
  revalidatePath("/dashboard/enrollments");
  revalidatePath("/dashboard/notifications");

  if (result.autoRejected) {
    return {
      success: true,
      autoRejected: true,
      message: "Payment was auto-rejected because enrollment period has ended",
      payment: serializePayment(result.payment),
    };
  }

  return { success: true, payment: serializePayment(result.payment) };
}

/* =====================================================
   ADMIN: REJECT PAYMENT
===================================================== */
export async function rejectPaymentAction(
  enrollmentId: string,
  reason: string,
) {
  const admin = await requireRole(["ADMIN"]);

  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: true, batch: true, payment: true },
    });

    if (!enrollment) throw new Error("Enrollment not found");
    if (!enrollment.payment) throw new Error("No payment found");

    if (enrollment.status !== "PAYMENT_SUBMITTED")
      throw new Error("Invalid state");
    if (enrollment.payment.status !== "PENDING")
      throw new Error("Payment already verified");

    const payment = await tx.payment.update({
      where: { id: enrollment.payment.id },
      data: {
        status: "REJECTED",
        verifiedById: admin.id,
        verifiedAt: new Date(),
      },
      include: {
        enrollment: {
          include: { user: true, batch: true },
        },
      },
    });

    await tx.batch.update({
      where: { id: enrollment.batchId },
      data: { seats: { increment: 1 } },
    });

    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectReason: reason,
      },
    });

    await tx.notification.create({
      data: {
        userId: enrollment.userId,
        title: "Payment Rejected",
        body: `Reason: ${reason}`,
        batchId: enrollment.batchId,
      },
    });

    const feeAmount = Number(enrollment.payment.amount);

    const html = EMAIL_TEMPLATES.paymentRejected(
      enrollment.user.name,
      feeAmount,
      payment.id,
      reason,
    );

    await emailQueue.add({
      type: "PAYMENT_NOTIFICATION",
      userId: enrollment.user.id,
      email: enrollment.user.email,
      subject: "Payment Rejected",
      html,
      isAdmin: false,
    });

    return payment;
  });

  // ✅ invalidate caches
  updateTag(TAGS.paymentsAdmin);
  updateTag(TAGS.paymentsPending);
  updateTag(TAGS.paymentsStats);
  updateTag(TAGS.enrollments);
  updateTag(TAGS.notifications);

  revalidatePath("/dashboard/admin/payments");
  revalidatePath("/dashboard/admin/enrollments");
  revalidatePath("/dashboard/admin/notifications");
  revalidatePath("/dashboard/enrollments");
  revalidatePath("/dashboard/notifications");

  return { success: true, payment: serializePayment(result) };
}

/* =====================================================
   ADMIN: GET ALL PAYMENTS WITH PAGINATION & FILTERS (CACHED)
===================================================== */
function cachedGetAllPayments(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}) {
  const cacheKey = keyFromParams("payments:admin:list", params);

  return unstable_cache(
    async () => {
      const {
        page = 1,
        pageSize = 10,
        search = "",
        status,
        method,
        startDate,
        endDate,
      } = params || {};

      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (search) {
        where.OR = [
          { trxId: { contains: search, mode: "insensitive" } },
          {
            enrollment: {
              user: { name: { contains: search, mode: "insensitive" } },
            },
          },
          {
            enrollment: {
              user: { email: { contains: search, mode: "insensitive" } },
            },
          },
          {
            enrollment: {
              batch: { name: { contains: search, mode: "insensitive" } },
            },
          },
        ];
      }

      if (status && status !== "all") where.status = status;
      if (method && method !== "all") where.method = method;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [totalCount, payments] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            enrollment: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, phone: true },
                },
                batch: { select: { id: true, name: true, price: true } },
              },
            },
            verifiedBy: { select: { id: true, name: true, email: true } },
          },
          skip,
          take: pageSize,
        }),
      ]);

      return {
        payments: payments.map(serializePayment),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    },
    [cacheKey],
    { revalidate: 30, tags: [TAGS.paymentsAdmin] },
  )();
}

export async function getAllPaymentsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}) {
  await requireRole(["ADMIN"]);
  return cachedGetAllPayments(params);
}

/* =====================================================
   ADMIN: GET PENDING PAYMENTS (CACHED)
===================================================== */
const cachedGetPendingPayments = unstable_cache(
  async () => {
    const payments = await prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        enrollment: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
            batch: { select: { id: true, name: true, price: true } },
          },
        },
      },
      take: 20,
    });

    return payments.map(serializePayment);
  },
  ["payments:pending:list"],
  { revalidate: 15, tags: [TAGS.paymentsPending] },
);

export async function getPendingPaymentsAction() {
  await requireRole(["ADMIN"]);
  return cachedGetPendingPayments();
}

/* =====================================================
   ADMIN: DELETE PAYMENTS (INVALIDATE)
===================================================== */
export async function deletePaymentsAction(ids: string[]) {
  await requireRole(["ADMIN"]);

  const payments = await prisma.payment.findMany({
    where: {
      id: { in: ids },
      status: { in: ["APPROVED", "REJECTED"] },
    },
    select: { id: true },
  });

  if (payments.length > 0) {
    throw new Error("Cannot delete approved or rejected payments");
  }

  const result = await prisma.payment.deleteMany({
    where: { id: { in: ids } },
  });

  // ✅ invalidate caches
  updateTag(TAGS.paymentsAdmin);
  updateTag(TAGS.paymentsPending);
  updateTag(TAGS.paymentsStats);

  revalidatePath("/dashboard/admin/payments");
  return { success: true, deletedCount: result.count };
}

/* =====================================================
   ADMIN: GET PAYMENT STATISTICS (CACHED)
===================================================== */
const cachedGetPaymentStatistics = unstable_cache(
  async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [
      totalPayments,
      totalAmount,
      pendingCount,
      approvedCount,
      rejectedCount,
      todayPayments,
      todayAmount,
      thisMonthPayments,
      thisMonthAmount,
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "APPROVED" } }),
      prisma.payment.count({ where: { status: "REJECTED" } }),
      prisma.payment.count({ where: { createdAt: { gte: today } } }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: thisMonth } },
        _sum: { amount: true },
      }),
    ]);

    return {
      total: {
        count: totalPayments,
        amount: Number(totalAmount._sum.amount || 0),
      },
      status: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      today: {
        count: todayPayments,
        amount: Number(todayAmount._sum.amount || 0),
      },
      thisMonth: {
        count: thisMonthPayments,
        amount: Number(thisMonthAmount._sum.amount || 0),
      },
    };
  },
  ["payments:stats"],
  { revalidate: 30, tags: [TAGS.paymentsStats] },
);

export async function getPaymentStatisticsAction() {
  await requireRole(["ADMIN"]);
  return cachedGetPaymentStatistics();
}
