import { getAdminStatsAction } from "@/actions/admin.action";
import ExpireClassesButton from "@/components/admin/ExpireClassesButton";
import {
  Users,
  CalendarDays,
  FileCheck,
  CreditCard,
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
  Activity,
  DollarSign,
  UserPlus,
  BookOpen,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

// Status color mapping
const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PAYMENT_SUBMITTED: "bg-blue-100 text-blue-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default async function AdminDashboard() {
  const data = await getAdminStatsAction();

  // Calculate percentages for progress bars
  const emailPercentage = Math.min(
    Math.round(
      (data.emailStats.systemQuota.today / data.emailStats.systemQuota.limit) *
        100,
    ),
    100,
  );

  const statsCards = [
    {
      title: "Total Users",
      value: data.users,
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/dashboard/admin/users",
      description: "Registered users",
    },
    {
      title: "Total Batches",
      value: data.batches,
      icon: CalendarDays,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      link: "/dashboard/admin/batches",
      description: "Active batches",
    },
    {
      title: "Total Enrollments",
      value: data.enrollments,
      icon: FileCheck,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      link: "/dashboard/admin/enrollments",
      description: "All enrollments",
    },
    {
      title: "Total Payments",
      value: data.payments,
      icon: CreditCard,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      link: "/dashboard/admin/payments",
      description: `₱${(data.payments * 299).toLocaleString()} estimated`,
    },
  ];

  const paymentStats = [
    {
      title: "Pending Payments",
      value: data.pendingPayments,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      link: "/dashboard/admin/payments?status=PENDING",
    },
    {
      title: "Approved Payments",
      value: data.approvedPayments,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      link: "/dashboard/admin/payments?status=APPROVED",
    },
    {
      title: "Rejected Payments",
      value: data.rejectedPayments,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      link: "/dashboard/admin/payments?status=REJECTED",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your platform today.
          </p>
        </div>

        <div className="flex gap-2">
          <ExpireClassesButton count={data.expireCandidates} />
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              href={stat.link}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {stat.description}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Payment Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paymentStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              href={stat.link}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`h-10 w-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Email Quota & Enrollment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Email Quota Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Email Quota
              </h2>
            </div>
            <Link
              href="/dashboard/admin/email-logs"
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              View Logs →
            </Link>
          </div>

          <div className="space-y-4">
            {/* System Quota */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">System Today</span>
                <span className="font-medium">
                  {data.emailStats.systemQuota.today} /{" "}
                  {data.emailStats.systemQuota.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    emailPercentage > 90
                      ? "bg-red-500"
                      : emailPercentage > 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${emailPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {emailPercentage}% used •{" "}
                {data.emailStats.systemQuota.limit -
                  data.emailStats.systemQuota.today}{" "}
                remaining
              </p>
            </div>

            {/* User Limit */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Per User Limit</span>
                <span className="font-medium">
                  {data.emailStats.userLimit} emails/day
                </span>
              </div>
            </div>

            {/* Total Emails */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Total Emails Sent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.emailStats.totalEmails}
              </p>
            </div>
          </div>
        </div>

        {/* Enrollment Status Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Enrollment Status
              </h2>
            </div>
            <Link
              href="/dashboard/admin/enrollments"
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {Object.entries(data.enrollmentStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}
                  >
                    {status.replace("_", " ")}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/dashboard/admin/enrollments?status=PAYMENT_SUBMITTED"
              className="block w-full text-center px-4 py-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors text-sm font-medium"
            >
              Review Pending Payments ({data.enrollmentStatus.PAYMENT_SUBMITTED}
              )
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Users & Top Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Users
              </h2>
            </div>
            <Link
              href="/dashboard/admin/users"
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center">
                  {user.isVerified ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Batches */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Popular Batches
              </h2>
            </div>
            <Link
              href="/dashboard/admin/batches"
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {data.topBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {batch.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {batch._count.enrollments} students •{" "}
                    {batch._count.sessions} sessions
                  </p>
                </div>
                <div className="text-sm font-semibold text-violet-600">
                  ₱{batch.price.toString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Enrollments
            </h2>
          </div>
          <Link
            href="/dashboard/admin/enrollments"
            className="text-sm text-violet-600 hover:text-violet-700"
          >
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                  Student
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                  Batch
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentEnrollments.slice(0, 5).map((enrollment) => (
                <tr
                  key={enrollment.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">
                      {enrollment.user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {enrollment.user.email}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {enrollment?.batch?.name}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[
                          enrollment.status as keyof typeof statusColors
                        ]
                      }`}
                    >
                      {enrollment.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(enrollment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Payments
            </h2>
          </div>
          <Link
            href="/dashboard/admin/payments"
            className="text-sm text-violet-600 hover:text-violet-700"
          >
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                  Student
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                  Batch
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayments.slice(0, 5).map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">
                      {payment?.enrollment?.user.name}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {payment?.enrollment?.batch.name}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    ₱{payment.amount.toString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
