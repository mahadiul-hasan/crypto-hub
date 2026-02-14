"use client";

import { useRouter } from "next/navigation";
import { Copy, Trash2, Mail } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { deleteEmailLogsAction } from "@/actions/email.actions";
import { formatDate, formatTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  StatusBadge,
  StatusVariant,
} from "@/components/common/data-table/status-badge";
import { DataTable } from "@/components/common/data-table/index";

type EmailLog = {
  id: string;
  email: string;
  type: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

interface EmailLogsTableProps {
  initialLogs: EmailLog[];
  initialPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  emailTypes: string[];
  users: { id: string; name: string; email: string }[];
  searchParams: {
    page: string;
    pageSize: string;
    search: string;
    type: string;
    userId: string;
    startDate: string;
    endDate: string;
  };
}

const typeColors: Record<string, StatusVariant> = {
  WELCOME: "success",
  VERIFICATION: "info",
  PASSWORD_RESET: "warning",
  PAYMENT_CONFIRMATION: "success",
  PAYMENT_APPROVED: "success",
  PAYMENT_REJECTED: "danger",
  ENROLLMENT_CONFIRMATION: "info",
  BATCH_REMINDER: "warning",
  SYSTEM: "default",
};

export function EmailLogsTable({
  initialLogs,
  initialPagination,
  emailTypes,
  users,
  searchParams,
}: EmailLogsTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.search || "",
    type: searchParams.type || "all",
    userId: searchParams.userId || "all",
    startDate: searchParams.startDate || "",
    endDate: searchParams.endDate || "",
  });

  // Update local filters when searchParams change
  useEffect(() => {
    setLocalFilters({
      search: searchParams.search || "",
      type: searchParams.type || "all",
      userId: searchParams.userId || "all",
      startDate: searchParams.startDate || "",
      endDate: searchParams.endDate || "",
    });
  }, [searchParams]);

  const handleFilterChange = (filters: Record<string, any>) => {
    setLocalFilters({
      search: filters.search || "",
      type: filters.type || "all",
      userId: filters.userId || "all",
      startDate: filters.startDate || "",
      endDate: filters.endDate || "",
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    if (localFilters.search) params.set("search", localFilters.search);
    if (localFilters.type && localFilters.type !== "all")
      params.set("type", localFilters.type);
    if (localFilters.userId && localFilters.userId !== "all")
      params.set("userId", localFilters.userId);
    if (localFilters.startDate) params.set("startDate", localFilters.startDate);
    if (localFilters.endDate) params.set("endDate", localFilters.endDate);

    router.push(`/dashboard/admin/email-logs?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      search: "",
      type: "all",
      userId: "all",
      startDate: "",
      endDate: "",
    });

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    router.push(`/dashboard/admin/email-logs?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/dashboard/admin/email-logs?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", size.toString());
    params.set("page", "1");
    router.push(`/dashboard/admin/email-logs?${params.toString()}`);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const result = await deleteEmailLogsAction(ids);
      showToast(
        `Successfully deleted ${result.deletedCount} log(s)`,
        "success",
      );
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to delete logs", "error");
    }
  };

  const columns = [
    {
      key: "user",
      header: "User",
      cell: (log: EmailLog) =>
        log.user ? (
          <div>
            <p className="text-sm font-medium text-gray-900">{log.user.name}</p>
            <p className="text-xs text-gray-500">{log.user.email}</p>
            <p className="text-xs text-gray-400">{log.user.role}</p>
          </div>
        ) : (
          <span className="text-sm text-gray-400">System</span>
        ),
    },
    {
      key: "email",
      header: "Recipient",
      cell: (log: EmailLog) => (
        <div>
          <p className="text-sm text-gray-900">{log.email}</p>
          <p className="text-xs text-gray-500">To: {log.email}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      cell: (log: EmailLog) => (
        <StatusBadge
          status={log.type.replace(/_/g, " ")}
          variant={typeColors[log.type] || "default"}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Sent At",
      sortable: true,
      cell: (log: EmailLog) => (
        <div className="text-sm text-gray-600">
          <p>{formatDate(log.createdAt)}</p>
          <p className="text-xs text-gray-400">{formatTime(log.createdAt)}</p>
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: "Copy ID",
      icon: <Copy className="h-4 w-4 mr-2" />,
      onClick: (log: EmailLog) => {
        navigator.clipboard.writeText(log.id);
        showToast("Log ID copied to clipboard", "success");
      },
    },
    {
      label: "Copy Email",
      icon: <Mail className="h-4 w-4 mr-2" />,
      onClick: (log: EmailLog) => {
        navigator.clipboard.writeText(log.email);
        showToast("Email address copied to clipboard", "success");
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => {},
    },
  ];

  const typeOptions = [
    { value: "all", label: "All Types" },
    ...emailTypes.map((type) => ({
      value: type,
      label: type.replace(/_/g, " "),
    })),
  ];

  const userOptions = [
    { value: "all", label: "All Users" },
    ...users.map((user) => ({
      value: user.id,
      label: `${user.name} (${user.email})`,
    })),
  ];

  const filters = [
    {
      key: "search",
      label: "Search",
      type: "search" as const,
      placeholder: "Search by email or user name...",
      value: localFilters.search,
    },
    {
      key: "type",
      label: "Type",
      type: "select" as const,
      options: typeOptions,
      value: localFilters.type,
    },
    {
      key: "userId",
      label: "User",
      type: "select" as const,
      options: userOptions,
      value: localFilters.userId,
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
    <DataTable
      data={initialLogs}
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
  );
}
