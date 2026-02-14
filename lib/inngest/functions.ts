// lib/inngest/functions.ts
import { inngest } from "./client";
import { sendSystemEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";
import { isQuotaError } from "@/lib/email-limit";

type ProcessEmailEvent = {
  name: "email/job.process";
  data: {
    jobId: string;
  };
};

function computeBackoffMs(attempts: number): number {
  return 2000 * Math.pow(2, Math.max(0, attempts - 1));
}

export const processEmailJob = inngest.createFunction(
  {
    id: "process-email-job",
    retries: 0,
  },
  { event: "email/job.process" },
  async ({ event, step }) => {
    const { jobId } = event.data as ProcessEmailEvent["data"];

    // Step 1: Fetch the job from database
    const job = await step.run("fetch-job", async () => {
      const job = await prisma.emailJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error(`Email job with ID ${jobId} not found`);
      }

      return job;
    });

    // Step 2: Check for userId (required for sending)
    if (!job.userId) {
      // Permanent failure - no userId to send to
      await step.run("mark-as-failed", async () => {
        await prisma.emailJob.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            lastError: "Missing userId - cannot send email",
          },
        });
      });

      throw new Error(`Job ${jobId} has no userId - permanent failure`);
    }

    try {
      // Step 3: Send the email (now we know userId exists)
      await step.run("send-email", async () => {
        await sendSystemEmail(
          job.userId,
          job.email,
          job.subject,
          job.html,
          job.type,
          job.isAdmin,
        );
      });

      // Step 4: Update job status to SENT
      await step.run("update-job-success", async () => {
        await prisma.emailJob.update({
          where: { id: jobId },
          data: {
            status: "SENT",
            lastError: null,
          },
        });
      });

      return {
        success: true,
        jobId,
        message: "Email sent successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isQuota = isQuotaError(message);

      // Get current attempt count
      const currentJob = await step.run("fetch-current-attempts", async () => {
        return await prisma.emailJob.findUnique({
          where: { id: jobId },
          select: { attempts: true, maxAttempts: true },
        });
      });

      const currentAttempts = currentJob?.attempts ?? 0;
      const maxAttempts = currentJob?.maxAttempts ?? 3;

      const nextAttempts = isQuota ? currentAttempts : currentAttempts + 1;
      const shouldFailPermanently = nextAttempts >= maxAttempts;

      const delayMs = isQuota ? 60000 : computeBackoffMs(nextAttempts);
      const nextRunAt = new Date(Date.now() + delayMs);

      // Update job in database
      await step.run("update-job-failure", async () => {
        await prisma.emailJob.update({
          where: { id: jobId },
          data: {
            attempts: nextAttempts,
            status: shouldFailPermanently ? "FAILED" : "QUEUED",
            lastError: message,
            nextRunAt: shouldFailPermanently ? new Date() : nextRunAt,
          },
        });
      });

      if (!shouldFailPermanently) {
        await step.run("schedule-retry", async () => {
          await inngest.send({
            name: "email/job.process",
            data: { jobId },
            delay: `${delayMs}ms`,
          });
        });

        throw new Error(
          `Email sending failed, will retry in ${delayMs}ms: ${message}`,
        );
      }

      throw new Error(
        `Email sending failed permanently after ${nextAttempts} attempts: ${message}`,
      );
    }
  },
);

export const functions = [processEmailJob];
