import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { unstable_cache } from "next/cache";

/* ===============================
   Config
================================ */

const SESSION_COOKIE = "session_id";
const SESSION_EXPIRE_DAYS = 30;

/* ===============================
   Utils
================================ */

export function generateToken(size = 32) {
  return randomBytes(size).toString("hex");
}

/* ===============================
   Cookie Helper
================================ */

async function getCookieStore() {
  return await cookies();
}

/* ===============================
   Session Management
================================ */

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRE_DAYS);

  await prisma.userSession.create({
    data: { token, userId, expiresAt },
  });

  const cookieStore = await getCookieStore();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  await invalidateUserCache();
}

export async function destroySession() {
  const cookieStore = await getCookieStore();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return;

  await prisma.userSession.deleteMany({ where: { token } });
  cookieStore.delete(SESSION_COOKIE);
  await invalidateUserCache();
}

/* ===============================
   Current User (FIXED)
================================ */

// 👇 This function takes token as argument - accepts string | null
async function fetchUserByToken(token: string | null) {
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          isVerified: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) return null;

  // If the session expired, destroy and return null
  if (session.expiresAt < new Date()) {
    await destroySession();
    return null;
  }

  return session.user;
}

// 👇 Cached version - accepts string | null
const getCachedUser = unstable_cache(
  async (token: string | null) => {
    return await fetchUserByToken(token);
  },
  ["current-user"],
  {
    tags: ["user:session"],
  },
);

// 👇 Public function - convert undefined to null
export async function getCurrentUser() {
  const cookieStore = await getCookieStore();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  // 👇 Convert undefined to null
  return getCachedUser(token ?? null);
}

// 👇 Helper to invalidate cache
async function invalidateUserCache() {
  const { updateTag } = await import("next/cache");
  updateTag("user:session");
}

/* ===============================
   Require Auth
================================ */

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.isActive) {
    redirect("/auth/blocked");
  }

  return user;
}
