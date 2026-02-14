"use client";

import { useRouter } from "next/navigation";
import {
  Copy,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Video,
  Link as LinkIcon,
  XCircle,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  deleteClassesAction,
  expireClassAction,
} from "@/actions/class.actions";
import { formatDate, formatTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/common/data-table/status-badge";
import { DataTable } from "@/components/common/data-table/index";
import { EditClassModal } from "@/components/admin/class/edit-class-modal";
import { SessionStatus } from "@/lib/generated/prisma/enums";

type ClassSession = {
  id: string;
  title: string;
  meetingUrl: string;
  startsAt: string;
  endsAt: string;
  status: "ACTIVE" | "EXPIRED";
  createdAt: string;
  batch: {
    id: string;
    name: string;
    price: number;
  };
};

interface ClassesTableProps {
  initialClasses: ClassSession[];
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
    batchId: string;
    status: string;
    startDate: string;
    endDate: string;
  };
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
];

export function ClassesTable({
  initialClasses,
  initialPagination,
  batches,
  searchParams,
}: ClassesTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.search || "",
    batchId: searchParams.batchId || "all",
    status: searchParams.status || "all",
    startDate: searchParams.startDate || "",
    endDate: searchParams.endDate || "",
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);

  // Update local filters when searchParams change
  useEffect(() => {
    setLocalFilters({
      search: searchParams.search || "",
      batchId: searchParams.batchId || "all",
      status: searchParams.status || "all",
      startDate: searchParams.startDate || "",
      endDate: searchParams.endDate || "",
    });
  }, [searchParams]);

  // Helper functions
  const isUpcoming = (startsAt: string) => {
    return new Date(startsAt) > new Date();
  };

  const isOngoing = (startsAt: string, endsAt: string) => {
    const now = new Date();
    return now >= new Date(startsAt) && now <= new Date(endsAt);
  };

  const getStatusText = (cls: ClassSession) => {
    if (cls.status === "EXPIRED") return "Expired";
    if (isOngoing(cls.startsAt, cls.endsAt)) return "Live Now";
    if (isUpcoming(cls.startsAt)) return "Upcoming";
    return "Active";
  };

  const getStatusVariant = (
    cls: ClassSession,
  ): "success" | "info" | "warning" | "default" => {
    if (cls.status === "EXPIRED") return "default";
    if (isOngoing(cls.startsAt, cls.endsAt)) return "success";
    if (isUpcoming(cls.startsAt)) return "info";
    return "warning";
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    setLocalFilters({
      search: filters.search || "",
      batchId: filters.batchId || "all",
      status: filters.status || "all",
      startDate: filters.startDate || "",
      endDate: filters.endDate || "",
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    if (localFilters.search) params.set("search", localFilters.search);
    if (localFilters.batchId && localFilters.batchId !== "all")
      params.set("batchId", localFilters.batchId);
    if (localFilters.status && localFilters.status !== "all")
      params.set("status", localFilters.status);
    if (localFilters.startDate) params.set("startDate", localFilters.startDate);
    if (localFilters.endDate) params.set("endDate", localFilters.endDate);

    router.push(`/dashboard/admin/classes?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      search: "",
      batchId: "all",
      status: "all",
      startDate: "",
      endDate: "",
    });

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    router.push(`/dashboard/admin/classes?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/dashboard/admin/classes?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", size.toString());
    params.set("page", "1");
    router.push(`/dashboard/admin/classes?${params.toString()}`);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const result = await deleteClassesAction(ids);
      showToast(
        `Successfully deleted ${result.deletedCount} class(es)`,
        "success",
      );
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to delete classes", "error");
    }
  };

  const handleExpire = async (id: string) => {
    try {
      await expireClassAction(id);
      showToast("Class expired successfully", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to expire class", "error");
    }
  };

  const handleEdit = (cls: ClassSession) => {
    setSelectedClass(cls);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    router.refresh();
  };

  const columns = [
    {
      key: "title",
      header: "Class",
      sortable: true,
      cell: (cls: ClassSession) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{cls.title}</p>
          <p className="text-xs text-gray-500">{cls.batch.name}</p>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      cell: (cls: ClassSession) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(cls.startsAt)}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            <span>
              {formatTime(cls.startsAt)} - {formatTime(cls.endsAt)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "meetingUrl",
      header: "Meeting Link",
      cell: (cls: ClassSession) => (
        <a
          href={cls.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800 hover:underline"
        >
          <Video className="h-3 w-3" />
          <span>Join Meeting</span>
        </a>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (cls: ClassSession) => (
        <div className="space-y-1">
          <StatusBadge
            status={getStatusText(cls)}
            variant={getStatusVariant(cls)}
          />
          {isOngoing(cls.startsAt, cls.endsAt) && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Now
            </div>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (cls: ClassSession) => (
        <span className="text-sm text-gray-600">
          {formatDate(cls.createdAt)}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      onClick: (cls: ClassSession) => handleEdit(cls),
    },
    {
      label: "Copy ID",
      icon: <Copy className="h-4 w-4 mr-2" />,
      onClick: (cls: ClassSession) => {
        navigator.clipboard.writeText(cls.id);
        showToast("Class ID copied to clipboard", "success");
      },
    },
    {
      label: "Copy Meeting Link",
      icon: <LinkIcon className="h-4 w-4 mr-2" />,
      onClick: (cls: ClassSession) => {
        navigator.clipboard.writeText(cls.meetingUrl);
        showToast("Meeting link copied to clipboard", "success");
      },
    },
    {
      label: "Mark as Expired",
      icon: <XCircle className="h-4 w-4 mr-2" />,
      onClick: (cls: ClassSession) => handleExpire(cls.id),
      disabled: (cls: ClassSession) => cls.status === "EXPIRED",
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => {},
    },
  ];

  const batchOptions = [
    { value: "all", label: "All Batches" },
    ...batches.map((b) => ({ value: b.id, label: b.name })),
  ];

  const filters = [
    {
      key: "search",
      label: "Search",
      type: "search" as const,
      placeholder: "Search by class title or batch...",
      value: localFilters.search,
    },
    {
      key: "batchId",
      label: "Batch",
      type: "select" as const,
      options: batchOptions,
      value: localFilters.batchId,
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: statusOptions,
      value: localFilters.status,
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
        data={initialClasses}
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

      {/* Edit Class Modal */}
      {selectedClass && (
        <EditClassModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedClass(null);
          }}
          classData={selectedClass}
          batches={batches}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
