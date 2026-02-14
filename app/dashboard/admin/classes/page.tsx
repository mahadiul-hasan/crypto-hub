import {
  getAllClassesAction,
  getBatchesForClassFilterAction,
  getClassStatisticsAction,
} from "@/actions/class.actions";
import { ClassesTable } from "@/components/admin/class/classes-table";
import { CreateClassButton } from "@/components/admin/class/create-class-button";

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    batchId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const {
    page = "1",
    pageSize = "10",
    search = "",
    batchId = "",
    status = "",
    startDate = "",
    endDate = "",
  } = await searchParams;

  const [{ classes, pagination, filters }, batches, stats] = await Promise.all([
    getAllClassesAction({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search: search || undefined,
      batchId: batchId || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    getBatchesForClassFilterAction(),
    getClassStatisticsAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
        <CreateClassButton batches={batches} />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Classes</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Classes</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {stats.active}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Upcoming</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">
            {stats.upcoming}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Today's Classes</p>
          <p className="text-2xl font-semibold text-violet-600 mt-1">
            {stats.today}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">This Week</p>
          <p className="text-xl font-semibold text-gray-900">
            {stats.thisWeek} classes
          </p>
        </div>
        <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">This Month</p>
          <p className="text-xl font-semibold text-gray-900">
            {stats.thisMonth} classes
          </p>
        </div>
        <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Expired</p>
          <p className="text-xl font-semibold text-gray-900">
            {stats.expired} classes
          </p>
        </div>
      </div>

      <ClassesTable
        initialClasses={classes}
        initialPagination={pagination}
        batches={batches}
        searchParams={{
          page,
          pageSize,
          search,
          batchId,
          status,
          startDate,
          endDate,
        }}
      />
    </div>
  );
}
