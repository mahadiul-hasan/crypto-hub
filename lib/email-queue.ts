import prisma from "@/lib/prisma";

export interface EmailJobInput {
  type:
    | "VERIFICATION"
    | "VERIFICATION_RESEND"
    | "PASSWORD_RESET"
    | "PAYMENT_NOTIFICATION";
  userId: string;
  email: string;
  subject: string;
  html: string;
  isAdmin?: boolean;
}

class EmailQueue {
  async add(job: EmailJobInput) {
    await prisma.emailJob.create({
      data: {
        type: job.type,
        userId: job.userId ?? null,
        email: job.email,
        subject: job.subject,
        html: job.html,
        isAdmin: !!job.isAdmin,
        status: "QUEUED",
        attempts: 0,
        maxAttempts: 3,
        nextRunAt: new Date(),
      },
    });

    return true;
  }
}

export const emailQueue = new EmailQueue();
