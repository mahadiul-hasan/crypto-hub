"use client";

import { useRouter } from "next/navigation";
import { Edit, Copy, Trash2, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  deleteBatchesAction,
  publishBatchAction,
  closeBatchAction,
  togglePublishAction,
  updateBatchAction,
} from "@/actions/batch.actions";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/common/data-table/status-badge";
import { DataTable } from "@/components/common/data-table/index";
import { EditBatchModal } from "@/components/admin/batch/edit-batch-modal";

type Batch = {
  id: string;
  name: string;
  price: number;
  seats: number;
  isOpen: boolean;
  isPublished: boolean;
  enrollStart: string;
  enrollEnd: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    enrollments: number;
    sessions: number;
  };
};

interface BatchesTableProps {
  initialBatches: Batch[];
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
    isOpen: string;
  };
}

export function BatchesTable({
  initialBatches,
  initialPagination,
  searchParams,
}: BatchesTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.search || "",
    status: searchParams.status || "all",
    isOpen: searchParams.isOpen || "all",
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Update local filters when searchParams change
  useEffect(() => {
    setLocalFilters({
      search: searchParams.search || "",
      status: searchParams.status || "all",
      isOpen: searchParams.isOpen || "all",
    });
  }, [searchParams]);

  const handleFilterChange = (filters: Record<string, any>) => {
    setLocalFilters({
      search: filters.search || "",
      status: filters.status || "all",
      isOpen: filters.isOpen || "all",
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    if (localFilters.search) params.set("search", localFilters.search);
    if (localFilters.status && localFilters.status !== "all")
      params.set("status", localFilters.status);
    if (localFilters.isOpen && localFilters.isOpen !== "all")
      params.set("isOpen", localFilters.isOpen);

    router.push(`/dashboard/admin/batches?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      search: "",
      status: "all",
      isOpen: "all",
    });

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    router.push(`/dashboard/admin/batches?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/dashboard/admin/batches?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", size.toString());
    params.set("page", "1");
    router.push(`/dashboard/admin/batches?${params.toString()}`);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const result = await deleteBatchesAction(ids);
      showToast(
        `Successfully deleted ${result.deletedCount} batch(es)`,
        "success",
      );
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to delete batches", "error");
    }
  };

  const handlePublish = async (id: string, currentStatus: boolean) => {
    try {
      if (!currentStatus) {
        await publishBatchAction(id);
        showToast("Batch published and opened for enrollment", "success");
      } else {
        await togglePublishAction(id, false);
        showToast("Batch unpublished", "success");
      }
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to update batch", "error");
    }
  };

  const handleToggleOpen = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await closeBatchAction(id);
        showToast("Enrollment closed", "success");
      } else {
        await publishBatchAction(id);
        showToast("Enrollment opened", "success");
      }
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to toggle enrollment", "error");
    }
  };

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    router.refresh();
  };

  const getEnrollmentStatus = (batch: Batch) => {
    const now = new Date();
    const enrollStart = new Date(batch.enrollStart);
    const enrollEnd = new Date(batch.enrollEnd);

    if (!batch.isOpen) return "Closed";
    if (now < enrollStart) return "Scheduled";
    if (now > enrollEnd) return "Expired";
    return "Open";
  };

  const columns = [
    {
      key: "name",
      header: "Batch Name",
      sortable: true,
      cell: (batch: Batch) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{batch.name}</p>
          <p className="text-xs text-gray-500">
            {batch._count.enrollments} enrolled • {batch._count.sessions}{" "}
            sessions
          </p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (batch: Batch) => (
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(batch.price)}
        </span>
      ),
    },
    {
      key: "seats",
      header: "Seats",
      sortable: true,
      cell: (batch: Batch) => (
        <span className="text-sm text-gray-600">{batch.seats}</span>
      ),
    },
    {
      key: "enrollmentPeriod",
      header: "Enrollment Period",
      cell: (batch: Batch) => (
        <div className="text-sm text-gray-600">
          <p>{formatDate(batch.enrollStart)}</p>
          <p className="text-xs text-gray-400">
            to {formatDate(batch.enrollEnd)}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (batch: Batch) => {
        const status = getEnrollmentStatus(batch);
        const variant =
          status === "Open"
            ? "success"
            : status === "Scheduled"
              ? "info"
              : status === "Closed"
                ? "warning"
                : "danger";

        return (
          <div className="space-y-1">
            <StatusBadge status={status} variant={variant} />
            <div className="flex gap-1 mt-1">
              {batch.isPublished ? (
                <StatusBadge status="Published" variant="info" />
              ) : (
                <StatusBadge status="Unpublished" variant="default" />
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (batch: Batch) => (
        <span className="text-sm text-gray-600">
          {formatDate(batch.createdAt)}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      onClick: (batch: Batch) => handleEdit(batch),
    },
    {
      label: "Copy ID",
      icon: <Copy className="h-4 w-4 mr-2" />,
      onClick: (batch: Batch) => {
        navigator.clipboard.writeText(batch.id);
        showToast("Batch ID copied to clipboard", "success");
      },
    },
    {
      label: (batch: Batch) => (batch.isPublished ? "Unpublish" : "Publish"),
      icon: (batch: Batch) =>
        batch.isPublished ? (
          <EyeOff className="h-4 w-4 mr-2" />
        ) : (
          <Eye className="h-4 w-4 mr-2" />
        ),
      onClick: (batch: Batch) => handlePublish(batch.id, batch.isPublished),
    },
    {
      label: (batch: Batch) =>
        batch.isOpen ? "Close Enrollment" : "Open Enrollment",
      icon: (batch: Batch) =>
        batch.isOpen ? (
          <Lock className="h-4 w-4 mr-2" />
        ) : (
          <Unlock className="h-4 w-4 mr-2" />
        ),
      onClick: (batch: Batch) => handleToggleOpen(batch.id, batch.isOpen),
      disabled: (batch: Batch) => !batch.isPublished,
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
      placeholder: "Search by batch name...",
      value: localFilters.search,
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "all", label: "All Status" },
        { value: "published", label: "Published" },
        { value: "unpublished", label: "Unpublished" },
      ],
      value: localFilters.status,
    },
    {
      key: "isOpen",
      label: "Enrollment",
      type: "select" as const,
      options: [
        { value: "all", label: "All" },
        { value: "open", label: "Open" },
        { value: "closed", label: "Closed" },
      ],
      value: localFilters.isOpen,
    },
  ];

  return (
    <>
      <DataTable
        data={initialBatches}
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

      {/* Edit Modal */}
      {selectedBatch && (
        <EditBatchModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedBatch(null);
          }}
          batch={selectedBatch}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
