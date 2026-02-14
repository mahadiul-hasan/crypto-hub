"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { unstable_cache, updateTag, revalidatePath } from "next/cache";

// Helper to serialize batch data
function serializeBatch(batch: any) {
  return {
    ...batch,
    price: Number(batch.price),
    enrollStart: batch.enrollStart.toISOString(),
    enrollEnd: batch.enrollEnd.toISOString(),
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
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

/* ===============================
   PUBLIC: LIST PUBLISHED BATCHES
   (Homepage: show open/closed)
================================ */

const cachedPublicBatches = unstable_cache(
  async () => {
    const batches = await prisma.batch.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        seats: true,
        isOpen: true,
        isPublished: true,
        enrollStart: true,
        enrollEnd: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    return batches.map(serializeBatch);
  },
  ["batches:public"],
  { revalidate: 60, tags: ["batches:public"] },
);

export async function getPublicBatchesAction() {
  return cachedPublicBatches();
}

/* ===============================
   ADMIN: GET ALL BATCHES WITH PAGINATION & FILTERS
================================ */

const cachedAllBatches = unstable_cache(
  async (
    _paramsKey: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
      isOpen?: string;
    },
  ) => {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      status,
      isOpen,
    } = params || {};
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }];
    }

    if (status && status !== "all") {
      where.isPublished = status === "published";
    }

    if (isOpen && isOpen !== "all") {
      where.isOpen = isOpen === "open";
    }

    const totalCount = await prisma.batch.count({ where });

    const batches = await prisma.batch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        seats: true,
        isOpen: true,
        isPublished: true,
        enrollStart: true,
        enrollEnd: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: { where: { status: "ACTIVE" } },
            sessions: true,
          },
        },
      },
      skip,
      take: pageSize,
    });

    return {
      batches: batches.map(serializeBatch),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  },
  ["batches:admin:list"],
  { revalidate: 30, tags: ["batches:admin:list", "admin:stats"] },
);

export async function getAllBatchesAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  isOpen?: string;
}) {
  await requireRole(["ADMIN"]);
  const key = stableKey(params || {});
  return cachedAllBatches(key, params);
}

/* ===============================
   ADMIN: CREATE BATCH
================================ */
export async function createBatchAction(data: {
  name: string;
  enrollStart: Date;
  enrollEnd: Date;
  price: number;
  seats: number;
}) {
  await requireRole(["ADMIN"]);

  if (data.enrollEnd <= data.enrollStart) {
    throw new Error("Invalid enrollment time window");
  }

  const batch = await prisma.batch.create({
    data: {
      ...data,
      isOpen: false,
      isPublished: false,
    },
  });

  // invalidate relevant caches
  updateTag("batches:public");
  updateTag("batches:admin:list");
  updateTag("admin:stats");

  // optional (keeps your current behavior)
  revalidatePath("/dashboard/admin/batches");

  return {
    success: true,
    batch: serializeBatch(batch),
  };
}

/* ===============================
   ADMIN: UPDATE BATCH
================================ */
export async function updateBatchAction(
  id: string,
  data: {
    name?: string;
    enrollStart?: Date;
    enrollEnd?: Date;
    price?: number;
    seats?: number;
  },
) {
  await requireRole(["ADMIN"]);

  const batch = await prisma.batch.update({
    where: { id },
    data,
  });

  updateTag("batches:public");
  updateTag("batches:admin:list");
  updateTag("admin:stats");
  updateTag(`batch:${id}`);

  revalidatePath("/dashboard/admin/batches");

  return {
    success: true,
    batch: serializeBatch(batch),
  };
}

/* ===============================
   ADMIN: PUBLISH + OPEN ENROLLMENT
================================ */
export async function publishBatchAction(id: string) {
  await requireRole(["ADMIN"]);

  const batch = await prisma.batch.update({
    where: { id },
    data: {
      isPublished: true,
      isOpen: true,
    },
  });

  updateTag("batches:public");
  updateTag("batches:admin:list");
  updateTag("admin:stats");
  updateTag(`batch:${id}`);

  revalidatePath("/dashboard/admin/batches");

  return {
    success: true,
    batch: serializeBatch(batch),
  };
}

/* ===============================
   ADMIN: CLOSE ENROLLMENT
================================ */
export async function closeBatchAction(id: string) {
  await requireRole(["ADMIN"]);

  const batch = await prisma.batch.update({
    where: { id },
    data: {
      isOpen: false,
    },
  });

  updateTag("batches:public");
  updateTag("batches:admin:list");
  updateTag("admin:stats");
  updateTag(`batch:${id}`);

  revalidatePath("/dashboard/admin/batches");

  return {
    success: true,
    batch: serializeBatch(batch),
  };
}

/* ===============================
   ADMIN: TOGGLE PUBLISH STATUS
================================ */
export async function togglePublishAction(id: string, published: boolean) {
  await requireRole(["ADMIN"]);

  const batch = await prisma.batch.update({
    where: { id },
    data: {
      isPublished: published,
    },
  });

  updateTag("batches:public");
  updateTag("batches:admin:list");
  updateTag("admin:stats");
  updateTag(`batch:${id}`);

  revalidatePath("/dashboard/admin/batches");

  return {
    success: true,
    batch: serializeBatch(batch),
  };
}

/* ===============================
   ADMIN: DELETE BATCH
================================ */
export async function deleteBatchesAction(ids: string[]) {
  await requireRole(["ADMIN"]);

  const batchesWithEnrollments = await prisma.batch.findMany({
    where: {
      id: { in: ids },
      enrollments: { some: {} },
    },
    select: { id: true, name: true },
  });

  if (batchesWithEnrollments.length > 0) {
    throw new Error(
      `Cannot delete batches that have enrollments: ${batchesWithEnrollments
        .map((b) => b.name)
        .join(", ")}`,
    );
  }

  const result = await prisma.batch.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  updateTag("batches:public");
  updateTag("batches:admin:list");
  updateTag("admin:stats");
  for (const id of ids) updateTag(`batch:${id}`);

  revalidatePath("/dashboard/admin/batches");

  return { success: true, deletedCount: result.count };
}
