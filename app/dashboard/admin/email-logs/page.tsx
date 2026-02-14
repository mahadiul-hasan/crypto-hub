import {
  getEmailLogsAction,
  getUsersForFilterAction,
} from "@/actions/email.actions";
import { EmailLogsTable } from "@/components/admin/email-log/email-logs-table";

export default async function AdminEmailLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    type?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const {
    page = "1",
    pageSize = "10",
    search = "",
    type = "",
    userId = "",
    startDate = "",
    endDate = "",
  } = await searchParams;

  const [{ logs, pagination, filters }, users] = await Promise.all([
    getEmailLogsAction({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search: search || undefined,
      type: type || undefined,
      userId: userId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    getUsersForFilterAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Email Logs</h1>
      </div>

      <EmailLogsTable
        initialLogs={logs}
        initialPagination={pagination}
        emailTypes={filters.types}
        users={users}
        searchParams={{
          page,
          pageSize,
          search,
          type,
          userId,
          startDate,
          endDate,
        }}
      />
    </div>
  );
}
