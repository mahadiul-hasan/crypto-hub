"use client";

import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { deleteEnrollmentsAction } from "@/actions/enrollment.actions";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/common/data-table/status-badge";
import { DataTable } from "@/components/common/data-table/index";

type Enrollment = {
  id: string;
  status: string;
  enrollmentFee: number;
  createdAt: string;
  paidAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  batch: {
    id: string;
    name: string;
    price: number;
    enrollStart: string;
    enrollEnd: string;
  };
  payment?: {
    id: string;
    trxId: string;
    method: string;
    amount: number;
    status: string;
    senderNumber?: string;
  };
};

interface EnrollmentsTableProps {
  initialEnrollments: Enrollment[];
  initialPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  batches: { id: string; name: string }[];
  searchParams: {
    page: string;
    pageSize: string;
    search: string;
    status: string;
    batchId: string;
  };
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "PAYMENT_SUBMITTED", label: "Payment Submitted" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

const statusColors = {
  PENDING: "warning",
  PAYMENT_SUBMITTED: "info",
  ACTIVE: "success",
  REJECTED: "danger",
  CANCELLED: "default",
  EXPIRED: "default",
} as const;

export function EnrollmentsTable({
  initialEnrollments,
  initialPagination,
  batches,
  searchParams,
}: EnrollmentsTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.search || "",
    status: searchParams.status || "all",
    batchId: searchParams.batchId || "all",
  });

  // Update local filters when searchParams change
  useEffect(() => {
    setLocalFilters({
      search: searchParams.search || "",
      status: searchParams.status || "all",
      batchId: searchParams.batchId || "all",
    });
  }, [searchParams]);

  const handleFilterChange = (filters: Record<string, any>) => {
    setLocalFilters({
      search: filters.search || "",
      status: filters.status || "all",
      batchId: filters.batchId || "all",
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    if (localFilters.search) params.set("search", localFilters.search);
    if (localFilters.status && localFilters.status !== "all")
      params.set("status", localFilters.status);
    if (localFilters.batchId && localFilters.batchId !== "all")
      params.set("batchId", localFilters.batchId);

    router.push(`/dashboard/admin/enrollments?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      search: "",
      status: "all",
      batchId: "all",
    });

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    router.push(`/dashboard/admin/enrollments?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/dashboard/admin/enrollments?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", size.toString());
    params.set("page", "1");
    router.push(`/dashboard/admin/enrollments?${params.toString()}`);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const result = await deleteEnrollmentsAction(ids);
      showToast(
        `Successfully deleted ${result.deletedCount} enrollment(s)`,
        "success",
      );
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to delete enrollments", "error");
    }
  };

  const columns = [
    {
      key: "user",
      header: "Student",
      sortable: true,
      cell: (enrollment: Enrollment) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {enrollment.user.name}
          </p>
          <p className="text-xs text-gray-500">{enrollment.user.email}</p>
          {enrollment.user.phone && (
            <p className="text-xs text-gray-400">{enrollment.user.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: "batch",
      header: "Batch",
      cell: (enrollment: Enrollment) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {enrollment.batch.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatCurrency(enrollment.batch.price)}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (enrollment: Enrollment) => (
        <StatusBadge
          status={enrollment.status.replace("_", " ")}
          variant={
            statusColors[enrollment.status as keyof typeof statusColors] ||
            "default"
          }
        />
      ),
    },
    {
      key: "enrollmentFee",
      header: "Fee",
      sortable: true,
      cell: (enrollment: Enrollment) => (
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(enrollment.enrollmentFee)}
        </span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      cell: (enrollment: Enrollment) => {
        if (!enrollment.payment) {
          return <span className="text-sm text-gray-400">No payment</span>;
        }
        return (
          <div>
            <p className="text-sm text-gray-900">
              TRX: {enrollment.payment.trxId}
            </p>
            <p className="text-xs text-gray-500">{enrollment.payment.method}</p>
            <StatusBadge
              status={enrollment.payment.status}
              variant={
                enrollment.payment.status === "APPROVED" ? "success" : "warning"
              }
            />
          </div>
        );
      },
    },
    {
      key: "dates",
      header: "Dates",
      cell: (enrollment: Enrollment) => (
        <div className="text-sm text-gray-600">
          <p>Enrolled: {formatDate(enrollment.createdAt)}</p>
          {enrollment.paidAt && (
            <p className="text-xs">Paid: {formatDate(enrollment.paidAt)}</p>
          )}
          {enrollment.approvedAt && (
            <p className="text-xs">
              Approved: {formatDate(enrollment.approvedAt)}
            </p>
          )}
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: "Copy ID",
      icon: <Copy className="h-4 w-4 mr-2" />,
      onClick: (enrollment: Enrollment) => {
        navigator.clipboard.writeText(enrollment.id);
        showToast("Enrollment ID copied to clipboard", "success");
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => {},
    },
  ];

  const filters = [
    {
      key: "search",
      label: "Search",
      type: "search" as const,
      placeholder: "Search by student name, email, or batch...",
      value: localFilters.search,
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: statusOptions,
      value: localFilters.status,
    },
    {
      key: "batchId",
      label: "Batch",
      type: "select" as const,
      options: [
        { value: "all", label: "All Batches" },
        ...batches.map((b) => ({ value: b.id, label: b.name })),
      ],
      value: localFilters.batchId,
    },
  ];

  return (
    <>
      <DataTable
        data={initialEnrollments}
        columns={columns}
        actions={actions}
        filters={filters}
        pagination={initialPagination}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onDelete={handleDelete}
        selectable={true}
      />
    </>
  );
}
