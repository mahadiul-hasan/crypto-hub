"use server";

import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateToken, createSession, destroySession } from "@/lib/auth";

import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { emailQueue } from "@/lib/email-queue";

/* =====================================================
   SIGN UP
===================================================== */

export async function signUpAction(data: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    const { user, token } = await prisma.$transaction(
      async (tx) => {
        const exists = await tx.user.findUnique({
          where: { email: data.email },
        });

        if (exists) {
          throw new Error("EMAIL_EXISTS");
        }

        const hash = await hashPassword(data.password);

        const role =
          data.email === process.env.SUPER_ADMIN_EMAIL ? "ADMIN" : "STUDENT";

        const user = await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hash,
            role,
            isActive: false,
            isVerified: false,
          },
        });

        const token = generateToken();

        await tx.verificationToken.create({
          data: {
            token,
            userId: user.id,
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          },
        });

        return { user, token };
      },
      { timeout: 10000 },
    );

    /* Email outside transaction */

    const link = `${process.env.APP_URL}/auth/verify?token=${token}`;

    const html = EMAIL_TEMPLATES.verifyAccount(user.name, link);

    await emailQueue.add({
      type: "VERIFICATION",
      userId: user.id,
      email: user.email,
      subject: "Verify Your Account",
      html,
      isAdmin: false,
    });

    return {
      success: true,
      message: "Account created. Please verify your email.",
    };
  } catch (err: any) {
    console.error("Signup error:", err);

    if (err.message === "EMAIL_EXISTS") {
      throw new Error("Email already exists");
    }

    throw new Error("Signup failed");
  }
}

/* =====================================================
   RESEND VERIFICATION
===================================================== */

export async function resendVerificationAction(email: string) {
  try {
    const { user, token } = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { email },
        });

        if (!user) throw new Error("NOT_FOUND");

        if (user.isVerified) {
          throw new Error("ALREADY_VERIFIED");
        }

        await tx.verificationToken.deleteMany({
          where: { userId: user.id },
        });

        const token = generateToken();

        await tx.verificationToken.create({
          data: {
            token,
            userId: user.id,
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          },
        });

        return { user, token };
      },
      { timeout: 10000 },
    );

    const link = `${process.env.APP_URL}/auth/verify?token=${token}`;

    const html = EMAIL_TEMPLATES.resendVerification(user.name, link);

    await emailQueue.add({
      type: "VERIFICATION_RESEND",
      userId: user.id,
      email: user.email,
      subject: "Verify Your Account",
      html,
      isAdmin: false,
    });

    return {
      success: true,
      message: "Verification email sent.",
    };
  } catch (err: any) {
    console.error("Resend error:", err);

    if (err.message === "NOT_FOUND") {
      throw new Error("User not found");
    }

    if (err.message === "ALREADY_VERIFIED") {
      throw new Error("Already verified");
    }

    throw new Error("Resend failed");
  }
}

/* =====================================================
   VERIFY EMAIL
===================================================== */

export async function verifyEmailAction(token: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const record = await tx.verificationToken.findUnique({
        where: { token },
      });

      if (!record) throw new Error("INVALID");

      if (record.expiresAt < new Date()) {
        await tx.verificationToken.delete({
          where: { id: record.id },
        });

        throw new Error("EXPIRED");
      }

      await tx.user.update({
        where: { id: record.userId },
        data: {
          isActive: true,
          isVerified: true,
        },
      });

      await tx.verificationToken.delete({
        where: { id: record.id },
      });

      await tx.userSession.deleteMany({ where: { userId: record.userId } });
    });

    return {
      success: true,
      message: "Email verified",
    };
  } catch (err: any) {
    console.error("Verify error:", err);

    if (err.message === "INVALID") {
      throw new Error("Invalid link");
    }

    if (err.message === "EXPIRED") {
      throw new Error("Expired link");
    }

    throw new Error("Verification failed");
  }
}

/* =====================================================
   LOGIN
===================================================== */

export async function loginAction(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) throw new Error("Invalid credentials");

  const ok = await verifyPassword(data.password, user.password);

  if (!ok) throw new Error("Invalid credentials");

  if (!user.isActive) {
    throw new Error("Account inactive");
  }

  if (!user.isVerified) throw new Error("Please verify your email");

  await createSession(user.id);

  return true;
}

/* =====================================================
   LOGOUT
===================================================== */

export async function logoutAction() {
  await destroySession();
  return { success: true, message: "Logout successfully" };
}

/* =====================================================
   FORGOT PASSWORD
===================================================== */

export async function forgotPasswordAction(email: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const token = generateToken();

      await tx.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      return { user, token };
    });

    if (!result) {
      return {
        success: true,
        message: "If account exists, email will be sent",
      };
    }

    const link = `${process.env.APP_URL}/auth/reset?token=${result.token}`;

    const html = EMAIL_TEMPLATES.passwordReset(result.user.name, link);

    await emailQueue.add({
      type: "PASSWORD_RESET",
      userId: result.user.id,
      email: result.user.email,
      subject: "Reset Password",
      html,
      isAdmin: false,
    });

    return {
      success: true,
      message: "Reset email sent",
    };
  } catch (err) {
    console.error("Forgot error:", err);
    throw new Error("Request failed");
  }
}

/* =====================================================
   RESET PASSWORD
===================================================== */

export async function resetPasswordAction(token: string, password: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) throw new Error("Invalid token");

  if (record.expiresAt < new Date()) {
    throw new Error("Expired token");
  }

  const hash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { password: hash },
    });

    await tx.passwordResetToken.delete({
      where: { id: record.id },
    });

    await tx.userSession.deleteMany({
      where: { userId: record.userId },
    });
  });

  return { success: true, message: "Password reset successful" };
}
