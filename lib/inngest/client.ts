import { Inngest } from "inngest";

const appId = process.env.INNGEST_APP_ID || "email-queue-app";

export const inngest = new Inngest({
  id: appId,
  name: "Email Queue System",
});
