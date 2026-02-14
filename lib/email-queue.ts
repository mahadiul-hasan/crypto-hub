import prisma from "@/lib/prisma";
import { inngest } from "./inngest/client";

export interface EmailJobInput {
  type:
    | "VERIFICATION"
    | "VERIFICATION_RESEND"
    | "PASSWORD_RESET"
    | "PAYMENT_NOTIFICATION";
  userId: string; // Make it required, not optional
  email: string;
  subject: string;
  html: string;
  isAdmin?: boolean;
}

class EmailQueue {
  async add(job: EmailJobInput) {
    // Validate userId before creating job
    if (!job.userId) {
      throw new Error("userId is required for email job");
    }

    // Create the job in database
    const dbJob = await prisma.emailJob.create({
      data: {
        type: job.type,
        userId: job.userId, // Now definitely a string
        email: job.email,
        subject: job.subject,
        html: job.html,
        isAdmin: job.isAdmin || false,
        status: "QUEUED",
        attempts: 0,
        maxAttempts: 3,
        nextRunAt: new Date(),
      },
    });

    // Send event to Inngest
    await inngest.send({
      name: "email/job.process",
      data: {
        jobId: dbJob.id,
      },
    });

    return { success: true, jobId: dbJob.id };
  }

  async addBatch(jobs: EmailJobInput[]) {
    // Validate all jobs have userId
    for (const job of jobs) {
      if (!job.userId) {
        throw new Error("All jobs must have userId");
      }
    }

    const dbJobs = await prisma.$transaction(
      jobs.map((job) =>
        prisma.emailJob.create({
          data: {
            type: job.type,
            userId: job.userId,
            email: job.email,
            subject: job.subject,
            html: job.html,
            isAdmin: job.isAdmin || false,
            status: "QUEUED",
            attempts: 0,
            maxAttempts: 3,
            nextRunAt: new Date(),
          },
        }),
      ),
    );

    await inngest.send(
      dbJobs.map((job) => ({
        name: "email/job.process",
        data: { jobId: job.id },
      })),
    );

    return { success: true, count: dbJobs.length };
  }
}

export const emailQueue = new EmailQueue();
