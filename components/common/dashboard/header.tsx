"use client";

import { usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  CreditCard,
  Bell,
  Mail,
  BarChart3,
  UserPlus,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const routeTitles: Record<
  string,
  { title: string; parent?: string; icon: any }
> = {
  "/dashboard": { title: "Dashboard", icon: LayoutDashboard },
  "/dashboard/classes": {
    title: "My Classes",
    parent: "STUDENT",
    icon: Calendar,
  },
  "/dashboard/notifications": {
    title: "Notifications",
    parent: "STUDENT",
    icon: Bell,
  },
  "/dashboard/enrollments": {
    title: "Enrollments",
    parent: "STUDENT",
    icon: UserPlus,
  },
  "/dashboard/profile": {
    title: "profile",
    parent: "STUDENT",
    icon: Settings,
  },

  "/dashboard/admin": { title: "Dashboard", icon: LayoutDashboard },
  "/dashboard/admin/users": {
    title: "Manage Users",
    parent: "Admin",
    icon: Users,
  },
  "/dashboard/admin/classes": {
    title: "Manage Classes",
    parent: "Admin",
    icon: Calendar,
  },
  "/dashboard/admin/batches": {
    title: "Manage Batches",
    parent: "Admin",
    icon: Calendar,
  },
  "/dashboard/admin/enrollments": {
    title: "Manage Enrollments",
    parent: "Admin",
    icon: UserPlus,
  },
  "/dashboard/admin/payments": {
    title: "Manage Payments",
    parent: "Admin",
    icon: CreditCard,
  },
  "/dashboard/admin/notifications": {
    title: "Manage Notifications",
    parent: "Admin",
    icon: Bell,
  },
  "/dashboard/admin/email-logs": {
    title: "Email Logs",
    parent: "Admin",
    icon: Mail,
  },
  "/dashboard/admin/email-counters": {
    title: "Email Counters",
    parent: "Admin",
    icon: BarChart3,
  },
  "/dashboard/admin/queue-status": {
    title: "Queue Status",
    parent: "Admin",
    icon: BarChart3,
  },
  "/dashboard/admin/profile": {
    title: "Profile",
    parent: "Admin",
    icon: Settings,
  },
};

export default function Header() {
  const pathname = usePathname();
  const routeInfo = routeTitles[pathname] || {
    title: "Dashboard",
    icon: LayoutDashboard,
  };

  const Icon = routeInfo.icon;

  return (
    <div className="flex items-center space-x-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
        <Icon className="h-4 w-4 text-violet-600" />
      </div>
      <div className="flex flex-col">
        {routeInfo.parent && (
          <span className="text-xs text-gray-500">{routeInfo.parent}</span>
        )}
        <h1 className="text-lg font-semibold text-gray-900">
          {routeInfo.title}
        </h1>
      </div>
    </div>
  );
}
