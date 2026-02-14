import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";

/* ===============================
   Config
================================ */

const SESSION_COOKIE = "session_id"; // Cookie name
const SESSION_EXPIRE_DAYS = 30; // Expiry duration in days

/* ===============================
   Utils
================================ */

export function generateToken(size = 32) {
  return randomBytes(size).toString("hex");
}

/* ===============================
   Cookie Helper (IMPORTANT)
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

  // Create session in the database
  await prisma.userSession.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await getCookieStore();

  // Set the cookie with proper expiration, path, and other flags
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure cookie in production
    sameSite: "lax",
    path: "/",
    expires: expiresAt, // Set expiry on cookie
  });
}

export async function destroySession() {
  const cookieStore = await getCookieStore();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return;

  // Delete session from DB
  await prisma.userSession.deleteMany({
    where: { token },
  });

  // Delete session cookie
  cookieStore.delete(SESSION_COOKIE);
}

/* ===============================
   Current User
================================ */

export async function getCurrentUser() {
  const cookieStore = await getCookieStore();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  // Find the session by token
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
