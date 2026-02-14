import { getAllNotificationsAction } from "@/actions/notification.actions";
import { CleanupNotificationsButton } from "@/components/admin/notification/cleanup-notifications-button";
import { NotificationsTable } from "@/components/admin/notification/notifications-table";

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    userId?: string;
    isRead?: string;
    daysOld?: string;
  }>;
}) {
  const params = await searchParams;

  const page = params.page ? parseInt(params.page) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 10;
  const search = params.search || "";
  const userId = params.userId || "";
  const isRead = params.isRead || "";
  const daysOld = params.daysOld ? parseInt(params.daysOld) : 7;

  const { notifications, pagination } = await getAllNotificationsAction({
    page,
    pageSize,
    search: search || undefined,
    userId: userId || undefined,
    isRead: isRead || undefined,
    daysOld,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Notifications Management
        </h1>
        <CleanupNotificationsButton />
      </div>

      <NotificationsTable
        initialNotifications={notifications}
        initialPagination={pagination}
        searchParams={{
          page: page.toString(),
          pageSize: pageSize.toString(),
          search,
          userId,
          isRead,
          daysOld: daysOld.toString(),
        }}
      />
    </div>
  );
}
