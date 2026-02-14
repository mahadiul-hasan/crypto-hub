import { checkEmailQuota, consumeEmailQuotaAndLog } from "./email-limit";
import { sendMail } from "./mail";

export async function sendSystemEmail(
  userId: string,
  to: string,
  subject: string,
  html: string,
  type: string,
  isAdmin?: boolean,
) {
  await checkEmailQuota(userId, isAdmin);
  await sendMail(to, subject, html);

  // ✅ consume + log only after success
  await consumeEmailQuotaAndLog(userId, to, type, isAdmin);

  return { success: true };
}
