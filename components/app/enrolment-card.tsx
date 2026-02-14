"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  ArrowRight,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";
import {
  startEnrollmentAction,
  getMyEnrollmentsAction,
} from "@/actions/enrollment.actions";
import { Spinner } from "@/components/common/spinner";

type Batch = {
  id: string;
  name: string;
  price: number;
  seats: number;
  enrollStart: string;
  enrollEnd: string;
  _count: {
    enrollments: number;
  };
};

interface EnrolmentCardProps {
  batch: Batch;
}

export function EnrolmentCard({ batch }: EnrolmentCardProps) {
  const router = useRouter();
  const user = useUser();
  const { showToast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [seatsLeft, setSeatsLeft] = useState(
    batch.seats - batch._count.enrollments,
  );
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if user is already enrolled in this batch
  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      try {
        const enrollments = await getMyEnrollmentsAction();
        const existingEnrollment = enrollments.find(
          (e: any) => e.batchId === batch.id,
        );

        if (existingEnrollment) {
          setIsAlreadyEnrolled(true);
          setEnrollmentStatus(existingEnrollment.status);

          // Hide card if enrollment is active or pending
          if (
            ["ACTIVE", "PENDING", "PAYMENT_SUBMITTED"].includes(
              existingEnrollment.status,
            )
          ) {
            setIsVisible(false);
          }
        }
      } catch (error) {
        console.error("Failed to check enrollment status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkEnrollmentStatus();
  }, [user, batch.id]);

  // Calculate time left for enrollment
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(batch.enrollEnd);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Enrollment ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m remaining`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [batch.enrollEnd]);

  const handleEnroll = async () => {
    if (!user) {
      sessionStorage.setItem("pendingEnrollment", batch.id);
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

    setEnrolling(true);
    try {
      const result = await startEnrollmentAction(batch.id);
      showToast(
        "Enrollment started successfully! Please complete payment.",
        "success",
      );

      // Hide the card after successful enrollment
      setIsVisible(false);

      // Redirect to enrollments page
      router.push("/dashboard/enrollments");
    } catch (error: any) {
      // Handle specific error messages
      let errorMessage = error.message || "Failed to enroll";

      if (error.message?.includes("Already enrolled")) {
        errorMessage = "You are already enrolled in this batch";
        showToast(errorMessage, "info");
        setIsAlreadyEnrolled(true);
        router.push("/dashboard/enrollments");
      } else if (error.message?.includes("Verify email first")) {
        errorMessage = "Please verify your email before enrolling";
        showToast(errorMessage, "error");
        router.push("/auth/resend-verification");
      } else if (error.message?.includes("No seats left")) {
        errorMessage = "Sorry, no seats left in this batch";
        showToast(errorMessage, "error");
        setSeatsLeft(0);
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
      setEnrolling(false);
    }
  };

  const handleViewEnrollment = () => {
    router.push("/dashboard/enrollments");
  };

  // Check if batch is still open for enrollment
  const now = new Date();
  const start = new Date(batch.enrollStart);
  const end = new Date(batch.enrollEnd);
  const isEnrollmentOpen =
    batch.seats > 0 &&
    now >= start &&
    now <= end &&
    seatsLeft > 0 &&
    !isAlreadyEnrolled;

  // Don't show while checking status
  if (checkingStatus) return null;

  // Don't show for admin users
  if (user?.role === "ADMIN") return null;

  // Don't show if not visible or enrollment not open and not already enrolled
  if (!isVisible || (!isEnrollmentOpen && !isAlreadyEnrolled)) return null;

  // If already enrolled, show a different card
  if (isAlreadyEnrolled) {
    const statusMessages = {
      PENDING: "Your enrollment is pending. Please complete payment.",
      PAYMENT_SUBMITTED: "Your payment is under review.",
      ACTIVE: "You are actively enrolled in this course.",
      REJECTED: "Your enrollment was rejected.",
      EXPIRED: "Your enrollment has expired.",
    };

    const statusColors = {
      PENDING: "border-yellow-500",
      PAYMENT_SUBMITTED: "border-blue-500",
      ACTIVE: "border-green-500",
      REJECTED: "border-red-500",
      EXPIRED: "border-gray-500",
    };

    const statusBgColors = {
      PENDING: "from-yellow-500 to-orange-500",
      PAYMENT_SUBMITTED: "from-blue-500 to-indigo-500",
      ACTIVE: "from-green-500 to-emerald-500",
      REJECTED: "from-red-500 to-pink-500",
      EXPIRED: "from-gray-500 to-gray-600",
    };

    return (
      <div className="fixed bottom-6 left-6 z-50 max-w-sm animate-slide-up">
        <div
          className={`bg-white rounded-xl shadow-2xl border-l-4 ${statusColors[enrollmentStatus as keyof typeof statusColors] || "border-violet-600"} overflow-hidden`}
        >
          {/* Header */}
          <div
            className={`bg-linear-to-r ${statusBgColors[enrollmentStatus as keyof typeof statusBgColors] || "from-violet-600 to-blue-600"} px-4 py-3 flex items-center justify-between`}
          >
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold text-sm">Enrollment Status</span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-gray-900 mb-2">{batch.name}</h3>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                {statusMessages[
                  enrollmentStatus as keyof typeof statusMessages
                ] || "You have already enrolled in this batch."}
              </p>
            </div>

            <button
              onClick={handleViewEnrollment}
              className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center justify-center gap-2 group cursor-pointer"
            >
              View Enrollment Details
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Check your enrollment status and next steps
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-sm animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border-l-4 border-violet-600 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-violet-600 to-blue-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <AlertCircle className="h-4 w-4" />
            <span className="font-semibold text-sm">Limited Time Offer</span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-2">{batch.name}</h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-violet-600" />
              <span>
                Enrollment ends:{" "}
                {new Date(batch.enrollEnd).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-violet-600" />
              <span
                className={
                  timeLeft.includes("ended") ? "text-red-600 font-medium" : ""
                }
              >
                {timeLeft}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(batch.price)}
              </span>
              <span className="text-sm text-gray-500 ml-1">one-time</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900">
                {seatsLeft} seats
              </span>
              <span className="text-xs text-gray-500 block">left</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full"
                style={{
                  width: `${((batch.seats - seatsLeft) / batch.seats) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(((batch.seats - seatsLeft) / batch.seats) * 100)}%
              filled
            </p>
          </div>

          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 group cursor-pointer"
          >
            {enrolling ? (
              <>
                <Spinner size="sm" variant="white" />
                <span>Enrolling...</span>
              </>
            ) : (
              <>
                Enroll Now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Secure your spot before it's gone
          </p>
        </div>
      </div>
    </div>
  );
}
