import prisma from "@/lib/prisma";
import { sendSystemEmail } from "@/lib/mailer";

function computeBackoffMs(attempts: number) {
  // 2s, 4s, 8s, 16s...
  return 2000 * Math.pow(2, Math.max(0, attempts));
}

function isQuotaError(message: string) {
  return (
    message.includes("Daily email limit reached") ||
    message.includes("System email quota exceeded") ||
    message.includes("Please wait")
  );
}

export async function processEmailJobs(limit = 10) {
  const now = new Date();

  // 1) Claim jobs using SKIP LOCKED
  const jobs = await prisma.$transaction(async (tx) => {
    const claimed = await tx.$queryRawUnsafe<any[]>(`
      UPDATE "EmailJob"
      SET status = 'PROCESSING', "updatedAt" = NOW()
      WHERE id IN (
        SELECT id
        FROM "EmailJob"
        WHERE status = 'QUEUED'
          AND "nextRunAt" <= NOW()
        ORDER BY "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      )
      RETURNING *;
    `);

    return claimed;
  });

  if (!jobs.length) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      // If you require userId for quota/logs, enforce it:
      if (!job.userId) throw new Error("Missing userId for email job");

      // ✅ sendSystemEmail should do:
      // checkEmailQuota -> sendMail -> consumeEmailQuotaAndLog
      await sendSystemEmail(
        job.userId,
        job.email,
        job.subject,
        job.html,
        job.type, // ✅ pass type
        job.isAdmin,
      );

      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: "SENT",
          lastError: null,
        },
      });

      sent++;
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      const quotaErr = isQuotaError(msg);

      // ✅ quota/rate errors should NOT consume attempts
      const nextAttempts = quotaErr
        ? (job.attempts ?? 0)
        : (job.attempts ?? 0) + 1;

      const shouldFailPermanently = nextAttempts >= (job.maxAttempts ?? 3);

      const delayMs = quotaErr ? 60_000 : computeBackoffMs(nextAttempts);
      const nextRunAt = new Date(Date.now() + delayMs);

      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          attempts: nextAttempts,
          status: shouldFailPermanently ? "FAILED" : "QUEUED",
          lastError: msg,
          nextRunAt: shouldFailPermanently ? now : nextRunAt,
        },
      });

      failed++;
    }
  }

  return { processed: jobs.length, sent, failed };
}
