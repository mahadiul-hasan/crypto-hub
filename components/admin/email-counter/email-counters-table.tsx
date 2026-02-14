"use client";

import { useRouter } from "next/navigation";
import { Copy, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  deleteEmailCountersAction,
  resetEmailCounterAction,
} from "@/actions/email.actions";
import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  StatusBadge,
  StatusVariant,
} from "@/components/common/data-table/status-badge";
import { DataTable } from "@/components/common/data-table/index";

type EmailCounter = {
  id: string;
  scope: string;
  key: string;
  date: string;
  count: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

interface EmailCountersTableProps {
  initialCounters: EmailCounter[];
  initialPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  users: { id: string; name: string; email: string }[];
  searchParams: {
    page: string;
    pageSize: string;
    scope: string;
    userId: string;
    startDate: string;
    endDate: string;
    minCount: string;
  };
}

const scopeColors: Record<string, StatusVariant> = {
  GLOBAL: "info",
  USER: "default",
  BATCH: "success",
  SYSTEM: "warning",
};

export function EmailCountersTable({
  initialCounters,
  initialPagination,
  users,
  searchParams,
}: EmailCountersTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localFilters, setLocalFilters] = useState({
    scope: searchParams.scope || "all",
    userId: searchParams.userId || "all",
    startDate: searchParams.startDate || "",
    endDate: searchParams.endDate || "",
    minCount: searchParams.minCount || "",
  });

  // Update local filters when searchParams change
  useEffect(() => {
    setLocalFilters({
      scope: searchParams.scope || "all",
      userId: searchParams.userId || "all",
      startDate: searchParams.startDate || "",
      endDate: searchParams.endDate || "",
      minCount: searchParams.minCount || "",
    });
  }, [searchParams]);

  const handleFilterChange = (filters: Record<string, any>) => {
    setLocalFilters({
      scope: filters.scope || "all",
      userId: filters.userId || "all",
      startDate: filters.startDate || "",
      endDate: filters.endDate || "",
      minCount: filters.minCount || "",
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    if (localFilters.scope && localFilters.scope !== "all")
      params.set("scope", localFilters.scope);
    if (localFilters.userId && localFilters.userId !== "all")
      params.set("userId", localFilters.userId);
    if (localFilters.startDate) params.set("startDate", localFilters.startDate);
    if (localFilters.endDate) params.set("endDate", localFilters.endDate);
    if (localFilters.minCount) params.set("minCount", localFilters.minCount);

    router.push(`/dashboard/admin/email-counters?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      scope: "all",
      userId: "all",
      startDate: "",
      endDate: "",
      minCount: "",
    });

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    router.push(`/dashboard/admin/email-counters?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/dashboard/admin/email-counters?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", size.toString());
    params.set("page", "1");
    router.push(`/dashboard/admin/email-counters?${params.toString()}`);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const result = await deleteEmailCountersAction(ids);
      showToast(
        `Successfully deleted ${result.deletedCount} counter(s)`,
        "success",
      );
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to delete counters", "error");
    }
  };

  const handleReset = async (id: string) => {
    try {
      await resetEmailCounterAction(id);
      showToast("Counter reset successfully", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to reset counter", "error");
    }
  };

  const columns = [
    {
      key: "scope",
      header: "Scope",
      sortable: true,
      cell: (counter: EmailCounter) => (
        <StatusBadge
          status={counter.scope}
          variant={scopeColors[counter.scope] || "default"}
        />
      ),
    },
    {
      key: "key",
      header: "Key",
      cell: (counter: EmailCounter) => (
        <span className="text-sm font-mono text-gray-900">{counter.key}</span>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (counter: EmailCounter) =>
        counter.user ? (
          <div>
            <p className="text-sm font-medium text-gray-900">
              {counter.user.name}
            </p>
            <p className="text-xs text-gray-500">{counter.user.email}</p>
          </div>
        ) : (
          <span className="text-sm text-gray-400">System</span>
        ),
    },
    {
      key: "count",
      header: "Count",
      sortable: true,
      cell: (counter: EmailCounter) => (
        <div className="flex items-center gap-2">
          <span
            className={`text-lg font-semibold ${
              counter.count > 50
                ? "text-red-600"
                : counter.count > 30
                  ? "text-yellow-600"
                  : "text-green-600"
            }`}
          >
            {counter.count}
          </span>
          {counter.scope === "USER" && counter.count > 40 && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">
              Near limit
            </span>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      cell: (counter: EmailCounter) => (
        <span className="text-sm text-gray-600">
          {formatDate(counter.date)}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Copy ID",
      icon: <Copy className="h-4 w-4 mr-2" />,
      onClick: (counter: EmailCounter) => {
        navigator.clipboard.writeText(counter.id);
        showToast("Counter ID copied to clipboard", "success");
      },
    },
    {
      label: "Reset Counter",
      icon: <RefreshCw className="h-4 w-4 mr-2" />,
      onClick: (counter: EmailCounter) => handleReset(counter.id),
      disabled: (counter: EmailCounter) => counter.count === 0,
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => {},
    },
  ];

  const scopeOptions = [
    { value: "all", label: "All Scopes" },
    { value: "GLOBAL", label: "Global" },
    { value: "USER", label: "User" },
    { value: "BATCH", label: "Batch" },
    { value: "SYSTEM", label: "System" },
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
      key: "scope",
      label: "Scope",
      type: "select" as const,
      options: scopeOptions,
      value: localFilters.scope,
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
    {
      key: "minCount",
      label: "Min Count",
      type: "search" as const,
      placeholder: "Minimum count...",
      value: localFilters.minCount,
    },
  ];

  return (
    <DataTable
      data={initialCounters}
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
