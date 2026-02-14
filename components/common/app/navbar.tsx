"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { UserRole } from "@/lib/generated/prisma/enums";
import { useUser } from "@/context/UserContext";
import { LogoutButton } from "./logout-button";
import {
  getMyNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notification.actions";
import { cn, formatRelativeTime } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  batch?: { id: string; name: string } | null;
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const user = useUser();

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getMyNotificationsAction(5);
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setIsNotificationsOpen(false);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setIsNotificationsOpen(false);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Handle outside click for notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNotificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  // Handle outside click for sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle outside click for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isProfileOpen &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="sticky top-0 bg-white text-color p-4 sm:p-6 z-40 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-neutral-900 text-2xl font-bold">
            Crypto Hub
          </Link>

          {/* Desktop Menu - Hidden on mobile */}
          <div className="hidden lg:flex lg:items-center lg:space-x-6">
            <Link
              href="/course-details"
              className="text-neutral-900 hover:text-violet-600 transition-colors"
            >
              Course Details
            </Link>
            <Link
              href="/batches"
              className="text-neutral-900 hover:text-violet-600 transition-colors"
            >
              Open Batches
            </Link>
            <Link
              href="/student-feedback"
              className="text-neutral-900 hover:text-violet-600 transition-colors"
            >
              Student Feedback
            </Link>

            {user && (
              <Link
                href="/dashboard/classes"
                className="text-neutral-900 hover:text-violet-600 transition-colors"
              >
                My Classes
              </Link>
            )}

            {/* Desktop Auth Section */}
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Notifications Icon - Desktop */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-2 text-gray-600 hover:text-violet-600 hover:bg-gray-100 rounded-lg transition-colors relative cursor-pointer"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck className="h-3 w-3" />
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                          <div className="px-4 py-8 text-center">
                            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"></div>
                            <p className="text-xs text-gray-500 mt-2">
                              Loading...
                            </p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                              No notifications
                            </p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Mark as read"
                              className={cn(
                                "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer",
                                !notification.isRead && "bg-violet-50/30",
                              )}
                            >
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <p
                                    className={cn(
                                      "text-sm",
                                      !notification.isRead
                                        ? "font-semibold text-gray-900"
                                        : "text-gray-600",
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {notification.body}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatRelativeTime(notification.createdAt)}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 bg-violet-600 rounded-full mt-1"></span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="border-t border-gray-100 p-2">
                        <Link
                          href={
                            user.role === "ADMIN"
                              ? "/dashboard/admin/notifications"
                              : "/dashboard/notifications"
                          }
                          onClick={() => setIsNotificationsOpen(false)}
                          className="block w-full text-center text-sm text-violet-600 hover:text-violet-700 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 focus:outline-none cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold border-2 border-violet-300 hover:border-violet-500 transition-colors">
                      {getUserInitials()}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`w-4 h-4 text-neutral-600 transition-transform ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-100 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-neutral-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-violet-600 mt-1 capitalize">
                          {user.role.toLowerCase()}
                        </p>
                      </div>

                      {user.role === UserRole.ADMIN ? (
                        <>
                          <Link
                            href="/dashboard/admin"
                            className="block px-4 py-2 text-sm text-neutral-900 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                          <Link
                            href="/dashboard/admin/profile"
                            className="block px-4 py-2 text-sm text-neutral-900 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Profile
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-neutral-900 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/dashboard/profile"
                            className="block px-4 py-2 text-sm text-neutral-900 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Profile
                          </Link>
                          <Link
                            href="/dashboard/classes"
                            className="block px-4 py-2 text-sm text-neutral-900 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            My Classes
                          </Link>
                        </>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <div className="px-2">
                        <LogoutButton
                          variant="desktop"
                          onClose={() => setIsProfileOpen(false)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-violet-600 border border-violet-600 rounded-lg hover:bg-violet-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu and Actions - Always visible on mobile */}
          <div className="flex lg:hidden items-center space-x-2">
            {/* Mobile - Always show notifications if logged in */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 text-gray-600 hover:text-violet-600 relative cursor-pointer"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Mobile Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="px-4 py-8 text-center">
                          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"></div>
                          <p className="text-xs text-gray-500 mt-2">
                            Loading...
                          </p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={cn(
                              "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0",
                              !notification.isRead && "bg-violet-50/30",
                            )}
                          >
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <p
                                  className={cn(
                                    "text-sm",
                                    !notification.isRead
                                      ? "font-semibold text-gray-900"
                                      : "text-gray-600",
                                  )}
                                >
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {notification.body}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatRelativeTime(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <span className="h-2 w-2 bg-violet-600 rounded-full mt-1"></span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="border-t border-gray-100 p-2">
                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block w-full text-center text-sm text-violet-600 hover:text-violet-700 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              ref={menuButtonRef}
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-neutral-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-200 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "min(80%, 300px)" }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <span className="text-lg font-semibold text-neutral-900">Menu</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-neutral-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* User Info (if logged in) */}
            {user && (
              <div className="px-4 pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold border-2 border-violet-300">
                    {getUserInitials()}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{user.name}</p>
                    <p className="text-sm text-neutral-500">{user.email}</p>
                    <p className="text-xs text-violet-600 mt-1 capitalize">
                      {user.role.toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex flex-col space-y-2 px-4">
              <Link
                href="/course-details"
                className="py-2 text-neutral-900 hover:text-violet-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Course Details
              </Link>
              <Link
                href="/batches"
                className="py-2 text-neutral-900 hover:text-violet-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Open Batches
              </Link>
              <Link
                href="/student-feedback"
                className="py-2 text-neutral-900 hover:text-violet-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Student Feedback
              </Link>
              {user && (
                <>
                  <Link
                    href="/dashboard/classes"
                    className="py-2 text-neutral-900 hover:text-violet-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    My Classes
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    className="py-2 text-neutral-900 hover:text-violet-600 transition-colors flex items-center justify-between"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>

            {/* Dashboard Links (if logged in) */}
            {user && (
              <div className="mt-6 px-4">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Account
                </p>
                <div className="flex flex-col space-y-2">
                  {user.role === UserRole.ADMIN ? (
                    <>
                      <Link
                        href="/dashboard/admin"
                        className="py-2 text-neutral-900 hover:text-violet-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                      <Link
                        href="/dashboard/admin/profile"
                        className="py-2 text-neutral-900 hover:text-violet-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/dashboard"
                        className="py-2 text-neutral-900 hover:text-violet-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        className="py-2 text-neutral-900 hover:text-violet-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/classes"
                        className="py-2 text-neutral-900 hover:text-violet-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        My Classes
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="border-t p-4">
            {user ? (
              <LogoutButton variant="mobile" onClose={() => setIsOpen(false)} />
            ) : (
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="block w-full px-4 py-2 text-center text-violet-600 border border-violet-600 rounded-lg hover:bg-violet-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="block w-full px-4 py-2 text-center bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
