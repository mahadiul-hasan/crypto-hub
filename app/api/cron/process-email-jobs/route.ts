import { processEmailJobs } from "@/lib/email-worker";

export const runtime = "nodejs";

export async function GET() {
  const result = await processEmailJobs(10);
  return Response.json(result);
}
