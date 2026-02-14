"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { startEnrollmentAction } from "@/actions/enrollment.actions";
import { Spinner } from "@/components/common/spinner";

type Batch = {
  id: string;
  name: string;
  price: number;
  seats: number;
  isOpen: boolean;
  isPublished: boolean;
  enrollStart: string;
  enrollEnd: string;
  createdAt: string;
  _count: {
    enrollments: number;
  };
};

interface BatchesClientProps {
  initialBatches: Batch[];
  user: any;
  userEnrollments?: any[]; // Add user enrollments
}

export function BatchesClient({
  initialBatches,
  user,
  userEnrollments = [],
}: BatchesClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  // Create a map of batch IDs to user's enrollment status
  const enrollmentMap = new Map();
  userEnrollments.forEach((enrollment) => {
    enrollmentMap.set(enrollment.batchId, enrollment.status);
  });

  const handleEnroll = async (batchId: string) => {
    if (!user) {
      sessionStorage.setItem("pendingEnrollment", batchId);
      router.push("/auth/login?redirect=/batches");
      return;
    }

    if (!user.isVerified) {
      showToast("Please verify your email before enrolling", "error");
      router.push("/auth/resend-verification");
      return;
    }

    if (!user.isActive) {
      showToast("Your account is inactive. Please contact support.", "error");
      return;
    }

    setEnrollingId(batchId);
    try {
      const result = await startEnrollmentAction(batchId);
      showToast(
        "Enrollment started successfully! Please complete payment.",
        "success",
      );
      router.push("/dashboard/enrollments");
    } catch (error: any) {
      // Handle specific error messages
      let errorMessage = error.message || "Failed to enroll";

      if (error.message?.includes("Already enrolled")) {
        errorMessage = "You are already enrolled in this batch";
        showToast(errorMessage, "info");
        router.push("/dashboard/enrollments");
      } else if (error.message?.includes("Verify email first")) {
        errorMessage = "Please verify your email before enrolling";
        showToast(errorMessage, "error");
        router.push("/auth/resend-verification");
      } else if (error.message?.includes("No seats left")) {
        errorMessage = "Sorry, no seats left in this batch";
        showToast(errorMessage, "error");
      } else if (error.message?.includes("Outside enrollment period")) {
        errorMessage = "Enrollment period has ended";
        showToast(errorMessage, "error");
      } else if (error.message?.includes("Enrollment closed")) {
        errorMessage = "This batch is no longer accepting enrollments";
        showToast(errorMessage, "error");
      } else {
        showToast(errorMessage, "error");
      }
    } finally {
      setEnrollingId(null);
    }
  };

  const getBatchStatus = (batch: Batch) => {
    const now = new Date();
    const start = new Date(batch.enrollStart);
    const end = new Date(batch.enrollEnd);
    const userEnrollmentStatus = enrollmentMap.get(batch.id);

    // If user is already enrolled, show appropriate status
    if (userEnrollmentStatus) {
      const statusMap = {
        PENDING: {
          label: "Pending Payment",
          color: "bg-yellow-100 text-yellow-700",
          icon: Clock,
        },
        PAYMENT_SUBMITTED: {
          label: "Under Review",
          color: "bg-blue-100 text-blue-700",
          icon: FileText,
        },
        ACTIVE: {
          label: "Enrolled",
          color: "bg-green-100 text-green-700",
          icon: CheckCircle,
        },
        REJECTED: {
          label: "Rejected",
          color: "bg-red-100 text-red-700",
          icon: XCircle,
        },
      };
      return (
        statusMap[userEnrollmentStatus as keyof typeof statusMap] ||
        statusMap.PENDING
      );
    }

    // Regular status checks for non-enrolled users
    if (!batch.isOpen || !batch.isPublished) {
      return {
        label: "Closed",
        color: "bg-gray-100 text-gray-700",
        icon: XCircle,
      };
    }
    if (now < start) {
      return {
        label: "Upcoming",
        color: "bg-blue-100 text-blue-700",
        icon: Clock,
      };
    }
    if (now > end) {
      return {
        label: "Expired",
        color: "bg-red-100 text-red-700",
        icon: AlertCircle,
      };
    }
    if (batch.seats <= 0) {
      return {
        label: "Full",
        color: "bg-orange-100 text-orange-700",
        icon: Users,
      };
    }
    return {
      label: "Open",
      color: "bg-green-100 text-green-700",
      icon: CheckCircle,
    };
  };

  const getSeatsLeft = (batch: Batch) => {
    const enrolled = batch._count.enrollments;
    return Math.max(0, batch.seats - enrolled);
  };

  const getEnrollmentAction = (batch: Batch) => {
    const userEnrollmentStatus = enrollmentMap.get(batch.id);
    const seatsLeft = getSeatsLeft(batch);
    const status = getBatchStatus(batch);

    // If user is already enrolled
    if (userEnrollmentStatus) {
      const actionMap = {
        PENDING: {
          text: "Complete Payment",
          href: "/dashboard/enrollments",
          color: "bg-yellow-600 hover:bg-yellow-700",
        },
        PAYMENT_SUBMITTED: {
          text: "View Status",
          href: "/dashboard/enrollments",
          color: "bg-blue-600 hover:bg-blue-700",
        },
        ACTIVE: {
          text: "Go to Course",
          href: "/dashboard/classes",
          color: "bg-green-600 hover:bg-green-700",
        },
        REJECTED: {
          text: "View Details",
          href: "/dashboard/enrollments",
          color: "bg-red-600 hover:bg-red-700",
        },
      };

      const action = actionMap[userEnrollmentStatus as keyof typeof actionMap];

      return (
        <Link
          href={action.href}
          className={`w-full px-4 py-3 ${action.color} text-white rounded-lg transition-colors flex items-center justify-center`}
        >
          {action.text}
        </Link>
      );
    }

    // For non-enrolled users
    const isEnrollable = status.label === "Open" && seatsLeft > 0;

    if (isEnrollable) {
      return (
        <button
          onClick={() => handleEnroll(batch.id)}
          disabled={enrollingId === batch.id}
          className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        >
          {enrollingId === batch.id ? (
            <>
              <Spinner size="sm" variant="white" />
              <span className="ml-2">Enrolling...</span>
            </>
          ) : (
            "Enroll Now"
          )}
        </button>
      );
    }

    return (
      <button
        disabled
        className="w-full px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
      >
        {status.label === "Full" ? "Batch Full" : "Not Available"}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Available Batches
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our cryptocurrency courses and start your journey in the
            digital economy. Select a batch that fits your schedule.
          </p>
        </div>

        {/* Batches Grid */}
        {initialBatches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No batches available
            </h3>
            <p className="text-gray-500">
              Please check back later for new batches.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialBatches.map((batch) => {
              const status = getBatchStatus(batch);
              const StatusIcon = status.icon;
              const seatsLeft = getSeatsLeft(batch);
              const userEnrollmentStatus = enrollmentMap.get(batch.id);

              return (
                <div
                  key={batch.id}
                  className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow ${
                    userEnrollmentStatus
                      ? "border-violet-200 ring-1 ring-violet-100"
                      : "border-gray-200"
                  }`}
                >
                  {/* Header with status */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {batch.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
                      >
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {status.label}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(batch.price)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          Enroll: {formatDate(batch.enrollStart)} -{" "}
                          {formatDate(batch.enrollEnd)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {seatsLeft} of {batch.seats} seats left
                        </span>
                      </div>
                    </div>

                    {/* Show enrollment status message if already enrolled */}
                    {userEnrollmentStatus && (
                      <div className="mt-4 p-2 bg-violet-50 rounded-lg border border-violet-100">
                        <p className="text-xs text-violet-700">
                          You are already enrolled in this batch
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer with action */}
                  <div className="p-6 bg-gray-50">
                    {getEnrollmentAction(batch)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box for Logged Out Users */}
        {!user && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Ready to start your journey?
            </h3>
            <p className="text-blue-700 mb-4">
              Create an account or login to enroll in our courses.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/auth/login"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
