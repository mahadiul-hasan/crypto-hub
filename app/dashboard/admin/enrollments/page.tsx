import {
  getAllEnrollmentsAction,
  getBatchesForFilterAction,
} from "@/actions/enrollment.actions";
import { EnrollmentsTable } from "@/components/admin/enrollment/enrollments-table";

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    batchId?: string;
  }>;
}) {
  const {
    page = "1",
    pageSize = "10",
    search = "",
    status = "",
    batchId = "",
  } = await searchParams;

  const [{ enrollments, pagination }, batches] = await Promise.all([
    getAllEnrollmentsAction({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search: search || undefined,
      status: status || undefined,
      batchId: batchId || undefined,
    }),
    getBatchesForFilterAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Enrollments Management
        </h1>
      </div>

      <EnrollmentsTable
        initialEnrollments={enrollments}
        initialPagination={pagination}
        batches={batches}
        searchParams={{
          page,
          pageSize,
          search,
          status,
          batchId,
        }}
      />
    </div>
  );
}
