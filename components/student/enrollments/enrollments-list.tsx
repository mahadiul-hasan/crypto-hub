"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  ChevronRight,
  FileText,
  Eye,
} from "lucide-react";
import { formatDate, formatCurrency, formatRelativeTime } from "@/lib/utils";

type Enrollment = {
  id: string;
  status: "PENDING" | "PAYMENT_SUBMITTED" | "ACTIVE" | "REJECTED" | "EXPIRED";
  enrollmentFee: number;
  createdAt: string;
  paidAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  batch: {
    id: string;
    name: string;
    enrollStart: string;
    enrollEnd: string;
    isOpen: boolean;
    isPublished: boolean;
    price: number;
  };
  payment: {
    id: string;
    amount: number;
    method: string;
    trxId: string;
    paidAt: string | null;
    verifiedAt: string | null;
    slipUrl: string | null;
  } | null;
};

interface EnrollmentsListProps {
  initialEnrollments: Enrollment[];
}

function getStatusConfig(status: Enrollment["status"]) {
  const config = {
    PENDING: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
      icon: Clock,
      label: "Pending Payment",
      description: "Please complete your payment to proceed",
    },
    PAYMENT_SUBMITTED: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: AlertCircle,
      label: "Under Review",
      description: "Your payment is being verified",
    },
    ACTIVE: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      icon: CheckCircle,
      label: "Active",
      description: "You are enrolled in this course",
    },
    REJECTED: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      icon: XCircle,
      label: "Rejected",
      description: "Your enrollment was rejected",
    },
    EXPIRED: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      icon: Clock,
      label: "Expired",
      description: "Enrollment period has ended",
    },
  };
  return config[status];
}

function StatusBadge({ status }: { status: Enrollment["status"] }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  );
}

export function EnrollmentsList({ initialEnrollments }: EnrollmentsListProps) {
  const [enrollments] = useState(initialEnrollments);
  const [filter, setFilter] = useState<Enrollment["status"] | "all">("all");

  const filteredEnrollments = enrollments.filter((e) =>
    filter === "all" ? true : e.status === filter,
  );

  const getActionButton = (enrollment: Enrollment) => {
    switch (enrollment.status) {
      case "PENDING":
        return (
          <Link
            href={`/payments/create?enrollmentId=${enrollment.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            Pay Now
          </Link>
        );

      case "PAYMENT_SUBMITTED":
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            Payment Submited
          </div>
        );

      case "ACTIVE":
        return (
          <Link
            href="/dashboard/classes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <GraduationCap className="h-4 w-4" />
            View Upcomming Class
          </Link>
        );

      default:
        return null;
    }
  };

  if (enrollments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No enrollments yet
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto mb-6">
          You haven't enrolled in any courses yet. Browse our available batches
          and start your learning journey!
        </p>
        <Link
          href="/batches"
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
        >
          Browse Courses
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filter tabs */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === "all"
                ? "bg-violet-100 text-violet-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            All ({enrollments.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === "PENDING"
                ? "bg-yellow-100 text-yellow-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Pending ({enrollments.filter((e) => e.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("PAYMENT_SUBMITTED")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === "PAYMENT_SUBMITTED"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Under Review (
            {enrollments.filter((e) => e.status === "PAYMENT_SUBMITTED").length}
            )
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Active ({enrollments.filter((e) => e.status === "ACTIVE").length})
          </button>
        </div>
      </div>

      {/* Enrollments list */}
      <div className="divide-y divide-gray-100">
        {filteredEnrollments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No {filter === "all" ? "" : filter.toLowerCase().replace("_", " ")}{" "}
            enrollments found
          </div>
        ) : (
          filteredEnrollments.map((enrollment) => {
            const config = getStatusConfig(enrollment.status);
            const Icon = config.icon;

            return (
              <div
                key={enrollment.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${config.bg} bg-opacity-30`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Left side - Course info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${config.bg}`}>
                        <Icon className={`h-6 w-6 ${config.text}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {enrollment.batch.name}
                          </h3>
                          <StatusBadge status={enrollment.status} />
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                          {config.description}
                        </p>

                        {/* Enrollment details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Enrolled:{" "}
                                {formatRelativeTime(enrollment.createdAt)}
                              </span>
                            </div>

                            {enrollment.paidAt && (
                              <div className="flex items-center gap-2 text-gray-500">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>
                                  Paid: {formatDate(enrollment.paidAt)}
                                </span>
                              </div>
                            )}

                            {enrollment.approvedAt && (
                              <div className="flex items-center gap-2 text-gray-500">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>
                                  Approved: {formatDate(enrollment.approvedAt)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-500">
                              <DollarSign className="h-4 w-4" />
                              <span>
                                Fee: {formatCurrency(enrollment.enrollmentFee)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Enrollment ends:{" "}
                                {formatDate(enrollment.batch.enrollEnd)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Rejection reason */}
                        {enrollment.status === "REJECTED" &&
                          enrollment.rejectReason && (
                            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-xs text-red-600 font-medium">
                                Rejection reason:
                              </p>
                              <p className="text-sm text-red-700 mt-1">
                                {enrollment.rejectReason}
                              </p>
                            </div>
                          )}

                        {/* Payment info */}
                        {enrollment.payment && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium mb-2">
                              Payment Details
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-700">
                                  Transaction: {enrollment.payment.trxId}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Method: {enrollment.payment.method}
                                </p>
                              </div>
                              {enrollment.payment.slipUrl && (
                                <a
                                  href={enrollment.payment.slipUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  View Slip
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Action button */}
                  <div className="lg:w-48 flex lg:justify-end">
                    {getActionButton(enrollment)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
