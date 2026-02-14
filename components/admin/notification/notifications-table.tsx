"use client";

import { useRouter } from "next/navigation";
import {
  Copy,
  Trash2,
  Eye,
  Mail,
  MailOpen,
  User,
  Calendar,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  deleteNotificationsAction,
  markNotificationReadAction,
} from "@/actions/notification.actions";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/common/data-table/status-badge";
import { DataTable } from "@/components/common/data-table/index";

type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  batch?: {
    id: string;
    name: string;
  };
};

interface NotificationsTableProps {
  initialNotifications: Notification[];
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
    userId: string;
    isRead: string;
    daysOld: string;
  };
}

const readStatusOptions = [
  { value: "all", label: "All" },
  { value: "read", label: "Read" },
  { value: "unread", label: "Unread" },
];

export function NotificationsTable({
  initialNotifications,
  initialPagination,
  searchParams,
}: NotificationsTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.search || "",
    userId: searchParams.userId || "all",
    isRead: searchParams.isRead || "all",
    daysOld: searchParams.daysOld || "7",
  });

  // Update local filters when searchParams change
  useEffect(() => {
    setLocalFilters({
      search: searchParams.search || "",
      userId: searchParams.userId || "all",
      isRead: searchParams.isRead || "all",
      daysOld: searchParams.daysOld || "7",
    });
  }, [searchParams]);

  const handleFilterChange = (filters: Record<string, any>) => {
    setLocalFilters({
      search: filters.search || "",
      userId: filters.userId || "all",
      isRead: filters.isRead || "all",
      daysOld: filters.daysOld || "7",
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    if (localFilters.search) params.set("search", localFilters.search);
    if (localFilters.userId && localFilters.userId !== "all")
      params.set("userId", localFilters.userId);
    if (localFilters.isRead && localFilters.isRead !== "all")
      params.set("isRead", localFilters.isRead);
    if (localFilters.daysOld) params.set("daysOld", localFilters.daysOld);

    router.push(`/dashboard/admin/notifications?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      search: "",
      userId: "all",
      isRead: "all",
      daysOld: "7",
    });

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);
    params.set("daysOld", "7");

    router.push(`/dashboard/admin/notifications?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/dashboard/admin/notifications?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", size.toString());
    params.set("page", "1");
    router.push(`/dashboard/admin/notifications?${params.toString()}`);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const result = await deleteNotificationsAction(ids);
      showToast(
        `Successfully deleted ${result.deletedCount} notification(s)`,
        "success",
      );
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to delete notifications", "error");
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationReadAction(id);
      showToast("Notification marked as read", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to mark as read", "error");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Notification",
      sortable: true,
      cell: (notification: Notification) => (
        <div>
          <div className="flex items-center gap-2">
            {notification.readAt ? (
              <MailOpen className="h-4 w-4 text-gray-400" />
            ) : (
              <Mail className="h-4 w-4 text-violet-600" />
            )}
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {notification.body}
          </p>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (notification: Notification) => (
        <div>
          <p className="text-sm text-gray-900">{notification.user.name}</p>
          <p className="text-xs text-gray-500">{notification.user.email}</p>
        </div>
      ),
    },
    {
      key: "batch",
      header: "Batch",
      cell: (notification: Notification) =>
        notification.batch ? (
          <span className="text-sm text-gray-600">
            {notification.batch.name}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: "readStatus",
      header: "Status",
      cell: (notification: Notification) =>
        notification.readAt ? (
          <StatusBadge status="Read" variant="success" />
        ) : (
          <StatusBadge status="Unread" variant="warning" />
        ),
    },
    {
      key: "createdAt",
      header: "Sent",
      sortable: true,
      cell: (notification: Notification) => (
        <div className="text-sm text-gray-600">
          <p>{formatDate(notification.createdAt)}</p>
          <p className="text-xs text-gray-400">
            {formatTime(notification.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "readAt",
      header: "Read At",
      cell: (notification: Notification) =>
        notification.readAt ? (
          <div className="text-sm text-gray-600">
            <p>{formatDate(notification.readAt)}</p>
            <p className="text-xs text-gray-400">
              {formatTime(notification.readAt)}
            </p>
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
      onClick: (notification: Notification) => {
        navigator.clipboard.writeText(notification.id);
        showToast("Notification ID copied to clipboard", "success");
      },
    },
    {
      label: "Mark as Read",
      icon: <Eye className="h-4 w-4 mr-2" />,
      onClick: (notification: Notification) =>
        handleMarkAsRead(notification.id),
      disabled: (notification: Notification) => !!notification.readAt,
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => {},
    },
  ];

  // Get unique users for filter (you might want to fetch this from an API)
  const userOptions = [
    { value: "all", label: "All Users" },
    // This would be populated from an API call in a real app
  ];

  const filters = [
    {
      key: "search",
      label: "Search",
      type: "search" as const,
      placeholder: "Search by title or body...",
      value: localFilters.search,
    },
    {
      key: "userId",
      label: "User",
      type: "select" as const,
      options: userOptions,
      value: localFilters.userId,
    },
    {
      key: "isRead",
      label: "Read Status",
      type: "select" as const,
      options: readStatusOptions,
      value: localFilters.isRead,
    },
    {
      key: "daysOld",
      label: "Show",
      type: "select" as const,
      options: [
        { value: "1", label: "Last 24 hours" },
        { value: "7", label: "Last 7 days" },
        { value: "30", label: "Last 30 days" },
        { value: "90", label: "Last 90 days" },
      ],
      value: localFilters.daysOld,
    },
  ];

  return (
    <DataTable
      data={initialNotifications}
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
