import { getMyEnrollmentsAction } from "@/actions/enrollment.actions";
import { PaymentPage } from "@/components/app/payments/payment-page";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function CreatePaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await searchParams;

  if (!enrollmentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-red-200 shadow-lg max-w-md w-full p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Invalid Request
          </h2>
          <p className="text-gray-600 mb-6">No enrollment ID provided.</p>
          <Link
            href="/dashboard/enrollments"
            className="inline-flex px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            View My Enrollments
          </Link>
        </div>
      </div>
    );
  }

  // Get user enrollments to find the specific enrollment
  const enrollments = await getMyEnrollmentsAction();
  const enrollment = enrollments.find((e) => e.id === enrollmentId);

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-red-200 shadow-lg max-w-md w-full p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Enrollment Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The enrollment you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <Link
            href="/dashboard/enrollments"
            className="inline-flex px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            View My Enrollments
          </Link>
        </div>
      </div>
    );
  }

  // Check if enrollment is in PENDING state (can submit payment)
  if (enrollment.status !== "PENDING") {
    const statusMessages = {
      PAYMENT_SUBMITTED: "Payment already submitted and pending verification.",
      ACTIVE: "You are already enrolled in this course.",
      REJECTED: "This enrollment was rejected.",
      EXPIRED: "This enrollment has expired.",
    };

    const message =
      statusMessages[enrollment.status as keyof typeof statusMessages] ||
      "Cannot submit payment for this enrollment.";

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-yellow-200 shadow-lg max-w-md w-full p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Payment Not Available
          </h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            href="/dashboard/enrollments"
            className="inline-flex px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            View My Enrollments
          </Link>
        </div>
      </div>
    );
  }

  return <PaymentPage enrollment={enrollment} />;
}
