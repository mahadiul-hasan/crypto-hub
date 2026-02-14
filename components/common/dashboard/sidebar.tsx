"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Command,
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Bell,
  Mail,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSidebar } from "@/context/SidebarContext";
import { NavUser } from "./nav-user";
import { Spinner } from "../spinner";

// Sidebar items for ADMIN with icons
const studentSidebarItems = [
  {
    name: "Dashboard",
    link: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Classes",
    link: "/dashboard/classes",
    icon: Calendar,
  },
  {
    name: "Enrollments",
    link: "/dashboard/enrollments",
    icon: UserPlus,
  },
  {
    name: "Notifications",
    link: "/dashboard/notifications",
    icon: Bell,
  },
];

const adminSidebarItems = [
  {
    name: "Dashboard",
    link: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Manage Users",
    link: "/dashboard/admin/users",
    icon: Users,
  },
  {
    name: "Manage Classes",
    link: "/dashboard/admin/classes",
    icon: Calendar,
  },
  {
    name: "Manage Batches",
    link: "/dashboard/admin/batches",
    icon: Calendar,
  },
  {
    name: "Manage Enrollments",
    link: "/dashboard/admin/enrollments",
    icon: UserPlus,
  },
  {
    name: "Manage Payments",
    link: "/dashboard/admin/payments",
    icon: CreditCard,
  },
  {
    name: "Manage Notifications",
    link: "/dashboard/admin/notifications",
    icon: Bell,
  },
  {
    name: "Email Logs",
    link: "/dashboard/admin/email-logs",
    icon: Mail,
  },
  {
    name: "Email Counters",
    link: "/dashboard/admin/email-counters",
    icon: BarChart3,
  },
];

export function AppSidebar() {
  const user = useUser();
  const pathname = usePathname();
  const { isOpen, toggleSidebar } = useSidebar();

  const sidebarOptions =
    user?.role === "ADMIN" ? adminSidebarItems : studentSidebarItems;

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen w-64 bg-white border-r border-gray-200">
        <Spinner size="lg" variant="primary" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile overlay - only shows when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          flex flex-col bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${isOpen ? "w-64" : "w-0"}
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          overflow-hidden
        `}
      >
        {/* Sidebar content - conditionally show/hide based on isOpen */}
        <div className={`flex flex-col h-full ${!isOpen && "lg:hidden"}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 shrink-0">
                <Command className="h-5 w-5 text-violet-600" />
              </div>
              {isOpen && (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    Crypto Hub
                  </span>
                  <span className="text-xs text-gray-500">Enterprise</span>
                </div>
              )}
            </Link>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              {sidebarOptions.map((item) => {
                const isActive =
                  pathname === item.link ||
                  (item.link !== "/dashboard/admin" &&
                    item.link !== "/dashboard" &&
                    pathname.startsWith(item.link));

                return (
                  <Link
                    key={item.link}
                    href={item.link}
                    className={`
                      flex items-center rounded-lg transition-colors duration-200
                      ${isOpen ? "px-3 py-2 space-x-3" : "px-2 py-2 justify-center"}
                      ${
                        isActive
                          ? "bg-violet-50 text-violet-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                    title={!isOpen ? item.name : undefined}
                  >
                    <item.icon
                      className={`h-5 w-5 shrink-0 ${isActive ? "text-violet-600" : "text-gray-400"}`}
                    />
                    {isOpen && (
                      <>
                        <span className="text-sm font-medium flex-1">
                          {item.name}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-5 bg-violet-600 rounded-full" />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-200 p-4">
            <NavUser isCollapsed={!isOpen} />
          </div>
        </div>
      </div>
    </>
  );
}
