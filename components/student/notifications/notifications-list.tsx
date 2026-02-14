"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Clock,
  BookOpen,
  Video,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/notification.actions";
import { formatRelativeTime } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  batch: {
    id: string;
    name: string;
  } | null;
  isRead: boolean;
  readAt: string | null;
};

interface NotificationsListProps {
  initialNotifications: Notification[];
}

function getNotificationIcon(title: string) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("class") || lowerTitle.includes("session")) {
    return <Video className="h-5 w-5 text-blue-500" />;
  }
  if (lowerTitle.includes("payment") || lowerTitle.includes("enroll")) {
    return <DollarSign className="h-5 w-5 text-green-500" />;
  }
  if (lowerTitle.includes("batch") || lowerTitle.includes("course")) {
    return <BookOpen className="h-5 w-5 text-violet-500" />;
  }
  if (lowerTitle.includes("alert") || lowerTitle.includes("important")) {
    return <AlertCircle className="h-5 w-5 text-orange-500" />;
  }
  if (lowerTitle.includes("success") || lowerTitle.includes("complete")) {
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  }
  return <Bell className="h-5 w-5 text-gray-500" />;
}

function getNotificationBg(isRead: boolean) {
  return isRead ? "bg-white" : "bg-blue-50/50";
}

export function NotificationsList({
  initialNotifications,
}: NotificationsListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationReadAction(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
      showToast("Notification marked as read", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to mark as read", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      showToast("No unread notifications", "info");
      return;
    }

    setLoading(true);
    try {
      await markAllNotificationsReadAction();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );
      showToast("All notifications marked as read", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to mark all as read", "error");
    } finally {
      setLoading(false);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No notifications yet
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          You're all caught up! We'll notify you when there are updates about
          your classes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header with actions */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === "all"
                  ? "bg-violet-100 text-violet-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                filter === "unread"
                  ? "bg-violet-100 text-violet-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === "read"
                  ? "bg-violet-100 text-violet-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Read
            </button>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="divide-y divide-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>
              No{" "}
              {filter === "unread" ? "unread" : filter === "read" ? "read" : ""}{" "}
              notifications
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${getNotificationBg(notification.isRead)}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="shrink-0">
                  <div
                    className={`p-2 rounded-lg ${
                      notification.isRead ? "bg-gray-100" : "bg-white shadow-sm"
                    }`}
                  >
                    {getNotificationIcon(notification.title)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        className={`text-sm font-medium ${
                          notification.isRead
                            ? "text-gray-600"
                            : "text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {notification.body}
                      </p>

                      {/* Meta info */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(notification.createdAt)}
                        </div>

                        {notification.batch && (
                          <Link
                            href={`/batches/${notification.batch.id}`}
                            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 hover:underline"
                          >
                            <BookOpen className="h-3 w-3" />
                            {notification.batch.name}
                          </Link>
                        )}

                        {notification.isRead && notification.readAt && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <CheckCheck className="h-3 w-3" />
                            Read {formatRelativeTime(notification.readAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                          title="Mark as read"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/50 text-center text-xs text-gray-500">
        Notifications are kept for 7 days
      </div>
    </div>
  );
}
