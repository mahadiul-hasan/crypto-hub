"use client";

import { useRouter } from "next/navigation";
import { UserCog, Copy, Trash2, Power, PowerOff } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  deleteUsersAction,
  updateUserRoleAction,
  toggleUserStatusAction,
} from "@/actions/admin.action";
import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { StatusBadge } from "../../common/data-table/status-badge";
import { DataTable } from "../../common/data-table/index";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
};

interface UsersTableProps {
  initialUsers: User[];
  initialPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  currentUserId?: string;
  searchParams: {
    page: string;
    pageSize: string;
    search: string;
    role: string;
    status: string;
  };
}

export function UsersTable({
  initialUsers,
  initialPagination,
  currentUserId,
  searchParams,
}: UsersTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.search || "",
    role: searchParams.role || "all",
    status: searchParams.status || "all",
  });

  // Update local filters when searchParams change
  useEffect(() => {
    setLocalFilters({
      search: searchParams.search || "",
      role: searchParams.role || "all",
      status: searchParams.status || "all",
    });
  }, [searchParams]);

  const handleFilterChange = (filters: Record<string, any>) => {
    // Update local state immediately for UI feedback
    setLocalFilters({
      search: filters.search || "",
      role: filters.role || "all",
      status: filters.status || "all",
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    // Add pagination
    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    // Add filters - only if they have values
    if (localFilters.search) params.set("search", localFilters.search);
    if (localFilters.role && localFilters.role !== "all")
      params.set("role", localFilters.role);
    if (localFilters.status && localFilters.status !== "all")
      params.set("status", localFilters.status);

    router.push(`/dashboard/admin/users?${params.toString()}`);
  };

  const handleResetFilters = () => {
    // Reset local state
    setLocalFilters({
      search: "",
      role: "all",
      status: "all",
    });

    // Clear URL params
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", searchParams.pageSize);

    router.push(`/dashboard/admin/users?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/dashboard/admin/users?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", size.toString());
    params.set("page", "1");
    router.push(`/dashboard/admin/users?${params.toString()}`);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const result = await deleteUsersAction(ids);
      showToast(
        `Successfully deleted ${result.deletedCount} user(s)`,
        "success",
      );
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to delete users", "error");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      showToast("You cannot change your own role", "error");
      return;
    }

    try {
      await updateUserRoleAction(userId, newRole);
      showToast(`User role updated to ${newRole}`, "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to update user role", "error");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      showToast("You cannot change your own status", "error");
      return;
    }

    try {
      await toggleUserStatusAction(userId, !currentStatus);
      showToast(
        `User ${!currentStatus ? "activated" : "deactivated"} successfully`,
        "success",
      );
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to toggle user status", "error");
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (user: User) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">
            {getUserInitials(user.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user.name}
              {user.id === currentUserId && (
                <span className="ml-2 text-xs text-violet-600">(You)</span>
              )}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (user: User) => (
        <span className="text-sm text-gray-600">{user.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      cell: (user: User) => (
        <StatusBadge
          status={user.role}
          variant={user.role === "ADMIN" ? "info" : "default"}
        />
      ),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      cell: (user: User) => (
        <StatusBadge
          status={user.isActive ? "Active" : "Inactive"}
          variant={user.isActive ? "success" : "danger"}
        />
      ),
    },
    {
      key: "isVerified",
      header: "Verified",
      cell: (user: User) => (
        <StatusBadge
          status={user.isVerified ? "Verified" : "Unverified"}
          variant={user.isVerified ? "success" : "warning"}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      cell: (user: User) => (
        <span className="text-sm text-gray-600">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Copy ID",
      icon: <Copy className="h-4 w-4 mr-2" />,
      onClick: (user: User) => {
        navigator.clipboard.writeText(user.id);
        showToast("User ID copied to clipboard", "success");
      },
    },
    {
      label: (user: User) =>
        `Change to ${user.role === "ADMIN" ? "STUDENT" : "ADMIN"}`,
      icon: <UserCog className="h-4 w-4 mr-2" />,
      onClick: (user: User) => {
        const newRole = user.role === "ADMIN" ? "STUDENT" : "ADMIN";
        handleRoleChange(user.id, newRole);
      },
      disabled: (user: User) => user.id === currentUserId,
    },
    {
      label: (user: User) => (user.isActive ? "Deactivate" : "Activate"),
      icon: (user: User) =>
        user.isActive ? (
          <PowerOff className="h-4 w-4 mr-2" />
        ) : (
          <Power className="h-4 w-4 mr-2" />
        ),
      onClick: (user: User) => handleToggleStatus(user.id, user.isActive),
      disabled: (user: User) => user.id === currentUserId,
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => {},
      disabled: (user: User) => user.id === currentUserId,
    },
  ];

  const filters = [
    {
      key: "search",
      label: "Search",
      type: "search" as const,
      placeholder: "Search by name or email...",
      value: localFilters.search,
    },
    {
      key: "role",
      label: "Role",
      type: "select" as const,
      options: [
        { value: "all", label: "All Roles" },
        { value: "ADMIN", label: "Admin" },
        { value: "STUDENT", label: "Student" },
      ],
      value: localFilters.role,
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      value: localFilters.status,
    },
  ];

  return (
    <DataTable
      data={initialUsers}
      columns={columns}
      actions={actions}
      filters={filters}
      pagination={initialPagination}
      currentUserId={currentUserId}
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
