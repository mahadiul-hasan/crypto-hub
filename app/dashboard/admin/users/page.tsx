import { getAllUsersAction } from "@/actions/admin.action";
import { CreateAdminButton } from "@/components/admin/user/create-admin-button";
import { UsersTable } from "@/components/admin/user/users-table";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    role?: string;
    status?: string;
  }>;
}) {
  const {
    page = "1",
    pageSize = "10",
    search = "",
    role = "",
    status = "",
  } = await searchParams;

  const user = await getCurrentUser();

  const { users, pagination } = await getAllUsersAction({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <CreateAdminButton />
      </div>

      <UsersTable
        initialUsers={users}
        initialPagination={pagination}
        currentUserId={user?.id}
        searchParams={{
          page,
          pageSize,
          search,
          role,
          status,
        }}
      />
    </div>
  );
}
