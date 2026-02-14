import { processEmailJobs } from "@/lib/email-worker";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Process jobs but DON'T return the full result
    await processEmailJobs(10);

    // Return minimal success response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log the full error internally
    console.error("Email processing failed:", error);

    // Return minimal error response
    return NextResponse.json(
      { success: false, error: "Processing failed" },
      { status: 500 },
    );
  }
}
