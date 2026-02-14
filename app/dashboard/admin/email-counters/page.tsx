import {
  getEmailCountersAction,
  getUsersForFilterAction,
  getEmailStatisticsAction,
} from "@/actions/email.actions";
import { EmailCountersTable } from "@/components/admin/email-counter/email-counters-table";

export default async function AdminEmailCountersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    scope?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    minCount?: string;
  }>;
}) {
  const {
    page = "1",
    pageSize = "10",
    scope = "",
    userId = "",
    startDate = "",
    endDate = "",
    minCount = "",
  } = await searchParams;

  const [{ counters, pagination, summary }, users, stats] = await Promise.all([
    getEmailCountersAction({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      scope: scope || undefined,
      userId: userId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      minCount: minCount ? parseInt(minCount) : undefined,
    }),
    getUsersForFilterAction(),
    getEmailStatisticsAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Email Counters</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">System Today</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats.systemQuota.today}
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                stats.systemQuota.percentageUsed > 90
                  ? "bg-red-500"
                  : stats.systemQuota.percentageUsed > 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${stats.systemQuota.percentageUsed}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.systemQuota.percentageUsed}% of {stats.systemQuota.limit}{" "}
            daily limit
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Yesterday</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats.systemQuota.yesterday}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Total emails sent yesterday
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total All Time</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats.totalEmails}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Emails sent since beginning
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Per User Limit</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats.userLimit}
          </p>
          <p className="text-xs text-gray-500 mt-2">Maximum per user per day</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-violet-50 to-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-violet-600">Total in View</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {summary.totalEmails}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            emails in selected period
          </p>
        </div>
        <div className="bg-linear-to-br from-blue-50 to-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-blue-600">Average per Day</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {summary.averagePerDay}
          </p>
          <p className="text-xs text-gray-500 mt-1">emails per day average</p>
        </div>
        <div className="bg-linear-to-br from-green-50 to-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-green-600">Peak Day</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {summary.maxInOneDay}
          </p>
          <p className="text-xs text-gray-500 mt-1">maximum in single day</p>
        </div>
      </div>

      <EmailCountersTable
        initialCounters={counters}
        initialPagination={pagination}
        users={users}
        searchParams={{
          page,
          pageSize,
          scope,
          userId,
          startDate,
          endDate,
          minCount,
        }}
      />
    </div>
  );
}
