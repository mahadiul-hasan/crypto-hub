import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Bell,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatTime, formatRelativeTime } from "@/lib/utils";
import { getUserDashboardStatsAction } from "@/actions/user.action";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const data = await getUserDashboardStatsAction();

  const stats = [
    {
      title: "Active Enrollments",
      value: data.stats.activeEnrollments,
      icon: CheckCircle,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Pending Approvals",
      value: data.stats.pendingEnrollments,
      icon: Clock,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      title: "Upcoming Classes",
      value: data.stats.upcomingClasses,
      icon: Calendar,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Unread Notifications",
      value: data.stats.unreadNotifications,
      icon: Bell,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
  ];

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAYMENT_SUBMITTED: "bg-blue-100 text-blue-800",
    ACTIVE: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    EXPIRED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Member since {formatDate(data.membership.registeredAt)} •{" "}
          {data.membership.duration}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Class & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Class */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Next Class
          </h2>
          {data.nextClass ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {data.nextClass.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.nextClass.batchName}
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Upcoming
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(data.nextClass.startsAt)}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(data.nextClass.startsAt)}
                </div>
              </div>
              <a
                href={data.nextClass.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
              >
                Join Class
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming classes</p>
              <Link
                href="/batches"
                className="inline-block mt-4 text-sm text-violet-600 hover:text-violet-700"
              >
                Browse Batches →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          {data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      {activity.batchName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[activity.status as keyof typeof statusColors]
                    }`}
                  >
                    {activity.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
              <Link
                href="/batches"
                className="inline-block mt-4 text-sm text-violet-600 hover:text-violet-700"
              >
                Enroll in a Batch →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/batches"
            className="flex items-center justify-between p-4 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-violet-600" />
              <span className="text-sm font-medium text-gray-900">
                Browse Batches
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-violet-600" />
          </Link>
          <Link
            href="/dashboard/enrollments"
            className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">
                View Payments
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-600" />
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">
                Update Profile
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-green-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
