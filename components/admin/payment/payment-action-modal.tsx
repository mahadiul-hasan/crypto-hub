"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Spinner } from "@/components/common/spinner";
import { formatCurrency } from "@/lib/utils";

type Payment = {
  id: string;
  trxId: string;
  method: string;
  senderNumber?: string;
  amount: number;
  status: string;
  enrollment: {
    id: string;
    user: { name: string; email: string };
    batch: { name: string };
  };
};

interface PaymentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  actionType: "approve" | "reject";
  onApprove: (paymentId: string, enrollmentId: string) => Promise<void>;
  onReject: (enrollmentId: string, reason: string) => Promise<void>;
}

export function PaymentActionModal({
  isOpen,
  onClose,
  payment,
  actionType,
  onApprove,
  onReject,
}: PaymentActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const { showToast } = useToast();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (actionType === "reject" && !rejectReason.trim()) {
      showToast("Please provide a rejection reason", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (actionType === "approve") {
        await onApprove(payment.id, payment.enrollment.id);
      } else {
        await onReject(payment.enrollment.id, rejectReason);
      }
      onClose();
    } catch (error: any) {
      showToast(error.message || `Failed to ${actionType} payment`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity cursor-pointer"
          onClick={() => !isSubmitting && onClose()}
        />

        {/* Modal Content */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {actionType === "approve" ? "Approve Payment" : "Reject Payment"}
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              {actionType === "approve"
                ? "This will approve the payment and activate the enrollment."
                : "This will reject the payment and restore the seat. Please provide a reason."}
            </p>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p>
                <span className="font-medium">Student:</span>{" "}
                {payment.enrollment.user.name}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {payment.enrollment.user.email}
              </p>
              <p>
                <span className="font-medium">Batch:</span>{" "}
                {payment.enrollment.batch.name}
              </p>
              <p>
                <span className="font-medium">TRX ID:</span> {payment.trxId}
              </p>
              <p>
                <span className="font-medium">Method:</span> {payment.method}
              </p>
              {payment.senderNumber && (
                <p>
                  <span className="font-medium">Sender:</span>{" "}
                  {payment.senderNumber}
                </p>
              )}
              <p>
                <span className="font-medium">Amount:</span>{" "}
                {formatCurrency(payment.amount)}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {actionType === "reject" && (
              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Rejection Reason
                </label>
                <textarea
                  id="reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Explain why this payment is being rejected..."
                  required
                />
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer ${
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Spinner
                      size="sm"
                      variant="white"
                      dataIcon="inline-start"
                    />
                    <span>Processing...</span>
                  </>
                ) : actionType === "approve" ? (
                  "Approve Payment"
                ) : (
                  "Reject Payment"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
