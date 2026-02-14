import { getEmailStatistics } from "@/lib/email-quota";
import prisma from "@/lib/prisma";

export default async function QueueStatusPage() {
  const stats = await getEmailStatistics();

  const queueStats = await prisma.emailJob.groupBy({
    by: ["status"],
    _count: true,
  });

  const recentJobs = await prisma.emailJob.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Email Queue Status</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-sm text-blue-600">QUEUED</div>
          <div className="text-2xl font-bold">
            {queueStats.find((s) => s.status === "QUEUED")?._count || 0}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-sm text-green-600">SENT</div>
          <div className="text-2xl font-bold">
            {queueStats.find((s) => s.status === "SENT")?._count || 0}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <div className="text-sm text-red-600">FAILED</div>
          <div className="text-2xl font-bold">
            {queueStats.find((s) => s.status === "FAILED")?._count || 0}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <div className="text-sm text-yellow-600">PROCESSING</div>
          <div className="text-2xl font-bold">
            {queueStats.find((s) => s.status === "PROCESSING")?._count || 0}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">System Quota</h2>
        <div className="bg-gray-200 h-4 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-4"
            style={{ width: `${stats.systemQuota.percentageUsed}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span>{stats.systemQuota.today} sent today</span>
          <span>Limit: {stats.systemQuota.limit}</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Attempts</th>
              <th className="p-2 text-left">Error</th>
              <th className="p-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {recentJobs.map((job) => (
              <tr key={job.id} className="border-b">
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      job.status === "SENT"
                        ? "bg-green-100 text-green-800"
                        : job.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : job.status === "PROCESSING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="p-2">{job.type}</td>
                <td className="p-2">{job.user?.email || job.email}</td>
                <td className="p-2">
                  {job.attempts}/{job.maxAttempts}
                </td>
                <td className="p-2 text-red-600 max-w-xs truncate">
                  {job.lastError || "-"}
                </td>
                <td className="p-2">
                  {new Date(job.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
