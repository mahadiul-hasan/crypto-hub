import {
  getAllPaymentsAction,
  getPaymentStatisticsAction,
} from "@/actions/payment.actions";
import { PaymentsTable } from "@/components/admin/payment/payments-table";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const {
    page = "1",
    pageSize = "10",
    search = "",
    status = "",
    method = "",
    startDate = "",
    endDate = "",
  } = await searchParams;

  const [{ payments, pagination }, statistics] = await Promise.all([
    getAllPaymentsAction({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search: search || undefined,
      status: status || undefined,
      method: method || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    getPaymentStatisticsAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Payments Management
        </h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {statistics.total.count}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Amount: {formatCurrency(statistics.total.amount)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600 mt-1">
            {statistics.status.pending}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {statistics.status.approved}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">
            {statistics.status.rejected}
          </p>
        </div>
      </div>

      {/* Today & This Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-linear-to-br from-violet-50 to-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-violet-600">Today</p>
          <div className="flex justify-between items-center mt-2">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {statistics.today.count}
              </p>
              <p className="text-xs text-gray-500">payments</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-violet-700">
                {formatCurrency(statistics.today.amount)}
              </p>
              <p className="text-xs text-gray-500">total amount</p>
            </div>
          </div>
        </div>
        <div className="bg-linear-to-br from-blue-50 to-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-blue-600">This Month</p>
          <div className="flex justify-between items-center mt-2">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {statistics.thisMonth.count}
              </p>
              <p className="text-xs text-gray-500">payments</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-blue-700">
                {formatCurrency(statistics.thisMonth.amount)}
              </p>
              <p className="text-xs text-gray-500">total amount</p>
            </div>
          </div>
        </div>
      </div>

      <PaymentsTable
        initialPayments={payments}
        initialPagination={pagination}
        searchParams={{
          page,
          pageSize,
          search,
          status,
          method,
          startDate,
          endDate,
        }}
      />
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
