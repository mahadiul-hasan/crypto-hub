import { getMyNotificationsAction } from "@/actions/notification.actions";
import { NotificationsList } from "@/components/student/notifications/notifications-list";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const notifications = await getMyNotificationsAction(50); // Get last 50 notifications

  // Calculate stats
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.length - unreadCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Bell className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Stay updated with your classes and announcements
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Notifications</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {notifications.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Unread</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold text-blue-600 mt-1">
              {unreadCount}
            </p>
            {unreadCount > 0 && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Read</p>
          <p className="text-2xl font-semibold text-gray-600 mt-1">
            {readCount}
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
