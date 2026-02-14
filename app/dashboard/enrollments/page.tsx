import { getMyEnrollmentsAction } from "@/actions/enrollment.actions";
import { EnrollmentsList } from "@/components/student/enrollments/enrollments-list";
import {
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default async function EnrollmentsPage() {
  const enrollments = await getMyEnrollmentsAction();

  // Calculate statistics
  const stats = {
    total: enrollments.length,
    pending: enrollments.filter((e) => e.status === "PENDING").length,
    paymentSubmitted: enrollments.filter(
      (e) => e.status === "PAYMENT_SUBMITTED",
    ).length,
    active: enrollments.filter((e) => e.status === "ACTIVE").length,
    rejected: enrollments.filter((e) => e.status === "REJECTED").length,
    expired: enrollments.filter((e) => e.status === "EXPIRED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-xl">
            <GraduationCap className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Enrollments</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track your course enrollments and payment status
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Enrollments</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats.total}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pending</p>
            <Clock className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-semibold text-yellow-600 mt-1">
            {stats.pending}
          </p>
          <p className="text-xs text-gray-400 mt-1">Awaiting payment</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Payment Submitted</p>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-blue-600 mt-1">
            {stats.paymentSubmitted}
          </p>
          <p className="text-xs text-gray-400 mt-1">Under review</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Active</p>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {stats.active}
          </p>
          <p className="text-xs text-gray-400 mt-1">Enrolled & learning</p>
        </div>
      </div>

      {/* Secondary Stats */}
      {(stats.rejected > 0 || stats.expired > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.rejected > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm font-medium text-red-700">
                  {stats.rejected} rejected enrollment
                  {stats.rejected > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          {stats.expired > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">
                  {stats.expired} expired enrollment
                  {stats.expired > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enrollments List */}
      <EnrollmentsList initialEnrollments={enrollments} />
    </div>
  );
}
