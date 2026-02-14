// app/api/cron/process-email-jobs/route.ts
import { processEmailJobs } from "@/lib/email-worker";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(null, { status: 401 });
  }

  try {
    // Process jobs - don't assign result to avoid any accidental logging
    await processEmailJobs(10);

    // Return absolutely nothing - just 200 OK
    return new Response(null, { status: 200 });
  } catch (error) {
    // Log internally only
    console.error("Email processing failed:", error);

    // Return 500 with empty body
    return new Response(null, { status: 500 });
  }
}
