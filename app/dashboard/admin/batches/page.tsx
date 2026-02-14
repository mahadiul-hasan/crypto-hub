import { getAllBatchesAction } from "@/actions/batch.actions";
import { BatchesTable } from "@/components/admin/batch/batches-table";
import { CreateBatchButton } from "@/components/admin/batch/create-batch-button";

export default async function AdminBatchesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    isOpen?: string;
  }>;
}) {
  const {
    page = "1",
    pageSize = "10",
    search = "",
    status = "",
    isOpen = "",
  } = await searchParams;

  const { batches, pagination } = await getAllBatchesAction({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    search: search || undefined,
    status: status || undefined,
    isOpen: isOpen || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Batches Management</h1>
        <CreateBatchButton />
      </div>

      <BatchesTable
        initialBatches={batches}
        initialPagination={pagination}
        searchParams={{
          page,
          pageSize,
          search,
          status,
          isOpen,
        }}
      />
    </div>
  );
}
