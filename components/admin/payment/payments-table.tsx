"use client";

import { useRouter } from "next/navigation";
import {
  Copy,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Smartphone,
  Landmark,
  Rocket,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  deletePaymentsAction,
  approvePaymentAction,
  rejectPaymentAction,
} from "@/actions/payment.actions";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/common/data-table/status-badge";
import { DataTable } from "@/components/common/data-table/index";
import { PaymentActionModal } from "@/components/admin/payment/payment-action-modal";

type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";
type PaymentMethod = "BKASH" | "NAGAD" | "ROCKET" | "BANK";

type Payment = {
  id: string;
  trxId: string;
  method: PaymentMethod;
  senderNumber?: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  verifiedAt?: string;
  paidAt?: string;
  enrollment: {
    id: string;
    enrollmentFee: number;
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
    };
  };
  verifiedBy?: {
    id: string;
    name: string;
    email: string;
  };
};

interface PaymentsTableProps {
  initialPayments: Payment[];
  initialPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  searchParams: {
    page: string;
    pageSize: string;
    search: string;
    status: string;
    method: string;
    startDate: string;
    endDate: string;
  };
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const methodOptions = [
  { value: "all", label: "All Methods" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "ROCKET", label: "Rocket" },
  { value: "BANK", label: "Bank" },
];

const methodIcons = {
  BKASH: <Smartphone className="h-4 w-4 text-pink-600" />,
  NAGAD: <Smartphone className="h-4 w-4 text-orange-600" />,
  ROCKET: <Rocket className="h-4 w-4 text-blue-600" />,
  BANK: <Landmark className="h-4 w-4 text-green-600" />,
};

const statusColors = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
} as const;

export function PaymentsTable({
  initialPayments,
  initialPagination,
  searchParams,
}: PaymentsTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.search || "",
    status: searchParams.status || "all",
    method: searchParams.method || "all",
    startDate: searchParams.startDate || "",
    endDate: searchParams.endDate || "",
  });

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  // Update local filters when searchParams change
  useEffect(() => {
    setLocalFilters({
      search: searchParams.search || "",
      status: searchParams.status || "all",
      method: searchParams.method || "all",
      startDate: searchParams.startDate || "",
      endDate: searchParams.endDate || "",
    });
  }, [searchParams]);

  const handleFilterChange = (filters: Record<string, any>) => {
    setLocalFilters({
      search: filters.search || "",
      status: filters.status || "all",
      method: filters.method || "all",
      startDate: filters.startDate || "",
      endDate: filters.endDate || "",
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    if (localFilters.search) params.set("search", localFilters.search);
    if (localFilters.status && localFilters.status !== "all")
      params.set("status", localFilters.status);
    if (localFilters.method && localFilters.method !== "all")
      params.set("method", localFilters.method);
    if (localFilters.startDate) params.set("startDate", localFilters.startDate);
    if (localFilters.endDate) params.set("endDate", localFilters.endDate);

    router.push(`/dashboard/admin/payments?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      search: "",
      status: "all",
      method: "all",
      startDate: "",
      endDate: "",
    });

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    router.push(`/dashboard/admin/payments?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/dashboard/admin/payments?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", size.toString());
    params.set("page", "1");
    router.push(`/dashboard/admin/payments?${params.toString()}`);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const result = await deletePaymentsAction(ids);
      showToast(
        `Successfully deleted ${result.deletedCount} payment(s)`,
        "success",
      );
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to delete payments", "error");
    }
  };

  const handleApprove = async (paymentId: string, enrollmentId: string) => {
    try {
      await approvePaymentAction(enrollmentId);
      showToast("Payment approved successfully", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to approve payment", "error");
    }
  };

  const handleReject = async (enrollmentId: string, reason: string) => {
    try {
      await rejectPaymentAction(enrollmentId, reason);
      showToast("Payment rejected successfully", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to reject payment", "error");
    }
  };

  const openActionModal = (payment: Payment, type: "approve" | "reject") => {
    setSelectedPayment(payment);
    setActionType(type);
    setActionModalOpen(true);
  };

  const columns = [
    {
      key: "trxId",
      header: "Transaction",
      sortable: true,
      cell: (payment: Payment) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{payment.trxId}</p>
          <div className="flex items-center gap-1 mt-1">
            {methodIcons[payment.method]}
            <span className="text-xs text-gray-500">{payment.method}</span>
          </div>
          {payment.senderNumber && (
            <p className="text-xs text-gray-400 mt-1">{payment.senderNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: "user",
      header: "Student",
      cell: (payment: Payment) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {payment.enrollment.user.name}
          </p>
          <p className="text-xs text-gray-500">
            {payment.enrollment.user.email}
          </p>
          {payment.enrollment.user.phone && (
            <p className="text-xs text-gray-400">
              {payment.enrollment.user.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "batch",
      header: "Batch",
      cell: (payment: Payment) => (
        <div>
          <p className="text-sm text-gray-900">
            {payment.enrollment.batch.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatCurrency(payment.enrollment.batch.price)}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (payment: Payment) => (
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(payment.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (payment: Payment) => (
        <StatusBadge
          status={payment.status}
          variant={statusColors[payment.status]}
        />
      ),
    },
    {
      key: "dates",
      header: "Dates",
      cell: (payment: Payment) => (
        <div className="text-sm text-gray-600">
          <p>Paid: {formatDate(payment.paidAt || payment.createdAt)}</p>
          {payment.verifiedAt && (
            <p className="text-xs text-gray-500">
              Verified: {formatDate(payment.verifiedAt)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "verifiedBy",
      header: "Verified By",
      cell: (payment: Payment) =>
        payment.verifiedBy ? (
          <div>
            <p className="text-sm text-gray-900">{payment.verifiedBy.name}</p>
            <p className="text-xs text-gray-500">{payment.verifiedBy.email}</p>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
  ];

  const actions = [
    {
      label: "Copy ID",
      icon: <Copy className="h-4 w-4 mr-2" />,
      onClick: (payment: Payment) => {
        navigator.clipboard.writeText(payment.id);
        showToast("Payment ID copied to clipboard", "success");
      },
    },
    {
      label: "Approve",
      icon: <CheckCircle className="h-4 w-4 mr-2" />,
      onClick: (payment: Payment) => openActionModal(payment, "approve"),
      disabled: (payment: Payment) => payment.status !== "PENDING",
    },
    {
      label: "Reject",
      icon: <XCircle className="h-4 w-4 mr-2" />,
      onClick: (payment: Payment) => openActionModal(payment, "reject"),
      disabled: (payment: Payment) => payment.status !== "PENDING",
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => {},
      disabled: (payment: Payment) => payment.status !== "PENDING",
    },
  ];

  const filters = [
    {
      key: "search",
      label: "Search",
      type: "search" as const,
      placeholder: "Search by TRX ID, student name, email...",
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
      key: "method",
      label: "Method",
      type: "select" as const,
      options: methodOptions,
      value: localFilters.method,
    },
    {
      key: "startDate",
      label: "Start Date",
      type: "date" as const,
      placeholder: "From date",
      value: localFilters.startDate,
    },
    {
      key: "endDate",
      label: "End Date",
      type: "date" as const,
      placeholder: "To date",
      value: localFilters.endDate,
    },
  ];

  return (
    <>
      <DataTable
        data={initialPayments}
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

      {/* Payment Action Modal */}
      {selectedPayment && (
        <PaymentActionModal
          isOpen={actionModalOpen}
          onClose={() => {
            setActionModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          actionType={actionType}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </>
  );
}
