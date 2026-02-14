"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { Calendar, Clock, AlertCircle, ArrowLeft, Info } from "lucide-react";
import { submitPaymentAction } from "@/actions/payment.actions";
import { useToast } from "@/context/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Spinner } from "@/components/common/spinner";
import Link from "next/link";
import { PaymentMethod } from "@/lib/generated/prisma/enums";

/** UI-supported methods (only these show instructions/buttons) */
const paymentMethods = {
  BKASH: {
    name: "bKash",
    number: "017XXXXXXXX",
    instructions: [
      "Dial *247# from your Bkash account",
      "Select 'Send Money'",
      "Enter our bKash number: 017XXXXXXXX",
      "Enter the exact amount: {amount}",
      "Enter reference: 'ENROLL'",
      "Enter your PIN to confirm",
      "Copy the transaction ID from confirmation SMS",
    ],
    icon: "📱",
  },
  NAGAD: {
    name: "Nagad",
    number: "017XXXXXXXX",
    instructions: [
      "Dial *167# from your Nagad account",
      "Select 'Send Money'",
      "Enter our Nagad number: 017XXXXXXXX",
      "Enter the exact amount: {amount}",
      "Enter reference: 'ENROLL'",
      "Enter your PIN to confirm",
      "Copy the transaction ID from confirmation SMS",
    ],
    icon: "📱",
  },
  ROCKET: {
    name: "Rocket",
    number: "017XXXXXXXX",
    instructions: [
      "Dial *322# from your Rocket account",
      "Select 'Send Money'",
      "Enter our Rocket number: 017XXXXXXXX",
      "Enter the exact amount: {amount}",
      "Enter reference: 'ENROLL'",
      "Enter your PIN to confirm",
      "Copy the transaction ID from confirmation SMS",
    ],
    icon: "🚀",
  },
} as const;

type InstructionMethod = keyof typeof paymentMethods; // "BKASH" | "NAGAD" | "ROCKET"
const isInstructionMethod = (m: unknown): m is InstructionMethod =>
  m === "BKASH" || m === "NAGAD" || m === "ROCKET";

/**
 * IMPORTANT:
 * - Form input allows "" (so RHF can have default "")
 * - Schema transforms "" -> undefined, then requires PaymentMethod
 */
const paymentSchema = z.object({
  method: z
    .union([z.enum(PaymentMethod), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .refine((v): v is PaymentMethod => v !== undefined, {
      message: "Please select a payment method",
    }),
  senderNumber: z
    .string()
    .min(11, "Phone number must be at least 11 digits")
    .max(14, "Phone number must not exceed 14 digits")
    .regex(
      /^01[3-9]\d{8}$/,
      "Please enter a valid Bangladeshi phone number (e.g., 01XXXXXXXXX)",
    ),
  trxId: z
    .string()
    .min(1, "Transaction ID is required")
    .max(50, "Transaction ID is too long"),
});

/** INPUT type (what RHF holds) */
type PaymentFormValues = {
  method: "" | PaymentMethod;
  senderNumber: string;
  trxId: string;
};

/** OUTPUT type (what submit receives after Zod transform/refine) */
type PaymentSubmitData = z.output<typeof paymentSchema>;

type Enrollment = {
  id: string;
  status: string;
  enrollmentFee: number;
  createdAt: string;
  batch: {
    id: string;
    name: string;
    enrollStart: string;
    enrollEnd: string;
    isOpen: boolean;
    price: number;
  };
};

interface PaymentPageProps {
  enrollment: Enrollment;
}

export function PaymentPage({ enrollment }: PaymentPageProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] =
    useState<InstructionMethod | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [enrollmentPeriodValid, setEnrollmentPeriodValid] = useState(true);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "",
      senderNumber: "",
      trxId: "",
    },
  });

  const watchedMethod = form.watch("method");

  useEffect(() => {
    const checkEnrollmentPeriod = () => {
      const now = new Date();
      const enrollEnd = new Date(enrollment.batch.enrollEnd);

      const isValid = now <= enrollEnd;
      setEnrollmentPeriodValid(isValid);

      if (!isValid) {
        setTimeLeft("Expired");
        return;
      }

      const diff = enrollEnd.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(
          `${days} day${days > 1 ? "s" : ""} ${hours} hour${
            hours > 1 ? "s" : ""
          } left`,
        );
      } else if (hours > 0) {
        setTimeLeft(`${hours} hour${hours > 1 ? "s" : ""} ${minutes} min left`);
      } else {
        setTimeLeft(`${minutes} minute${minutes > 1 ? "s" : ""} left`);
      }
    };

    checkEnrollmentPeriod();
    const timer = setInterval(checkEnrollmentPeriod, 60000);
    return () => clearInterval(timer);
  }, [enrollment.batch.enrollEnd]);

  const onSubmit: SubmitHandler<PaymentFormValues> = async (values) => {
    if (!enrollmentPeriodValid) {
      showToast(
        "Enrollment period has ended. You cannot submit payment.",
        "error",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate + transform with Zod (gives method: PaymentMethod)
      const data: PaymentSubmitData = paymentSchema.parse(values);

      const result = await submitPaymentAction({
        enrollmentId: enrollment.id,
        trxId: data.trxId,
        method: data.method, // PaymentMethod (✅)
        senderNumber: data.senderNumber,
      });

      if (result.success) {
        if ((result as any).autoRejected) {
          showToast(
            (result as any).message ||
              "Payment was auto-rejected due to enrollment period",
            "warning",
          );
          router.push("/dashboard/enrollments");
        } else {
          showToast(
            "Payment submitted successfully! Awaiting verification.",
            "success",
          );
          router.push("/dashboard/enrollments");
        }
      }
    } catch (error: any) {
      let errorMessage = error.message || "Failed to submit payment";

      if (errorMessage?.includes("Transaction already used")) {
        errorMessage = "This transaction ID has already been used";
        form.setError("trxId", { message: errorMessage });
      } else if (errorMessage?.includes("Invalid state")) {
        errorMessage = "Payment already submitted or processed";
      } else if (errorMessage?.includes("seats")) {
        errorMessage = "No seats left in this batch";
      }

      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!enrollmentPeriodValid) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container max-w-lg mx-auto px-4">
          <div className="bg-white rounded-xl border border-red-200 shadow-lg overflow-hidden">
            <div className="bg-red-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Enrollment Period Expired
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                The enrollment period for{" "}
                <strong>{enrollment.batch.name}</strong> ended on{" "}
                {formatDate(enrollment.batch.enrollEnd)}.
              </p>
              <p className="text-gray-600 mb-6">
                You cannot submit payment for this enrollment. If you still wish
                to join, please contact support or look for other available
                batches.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/batches"
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-center"
                >
                  Browse Other Batches
                </Link>
                <Link
                  href="/dashboard/enrollments"
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  View Enrollments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showInstructions = isInstructionMethod(watchedMethod);

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <Link
          href="/dashboard/enrollments"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Enrollments
        </Link>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-linear-to-r from-violet-600 to-blue-600 px-6 py-4">
                <h1 className="text-xl font-bold text-white">
                  Complete Payment
                </h1>
              </div>

              <div className="p-6">
                <div className="bg-violet-50 rounded-lg p-4 mb-6">
                  <h2 className="font-semibold text-gray-900 mb-2">
                    {enrollment.batch.name}
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-violet-600" />
                      <span>
                        Enrollment ends:{" "}
                        {formatDate(enrollment.batch.enrollEnd)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 text-violet-600" />
                      <span
                        className={
                          timeLeft.includes("left") &&
                          !timeLeft.includes("Expired")
                            ? "text-orange-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 text-center">
                  <p className="text-sm text-gray-500 mb-1">Amount to Pay</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(enrollment.enrollmentFee)}
                  </p>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <Controller
                    name="method"
                    control={form.control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Select Payment Method
                        </label>

                        <div className="grid grid-cols-3 gap-2">
                          {(
                            Object.keys(paymentMethods) as InstructionMethod[]
                          ).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => {
                                field.onChange(method);
                                setSelectedMethod(method);
                              }}
                              className={`p-3 border rounded-lg text-center transition-colors cursor-pointer ${
                                field.value === method
                                  ? "border-violet-600 bg-violet-50 ring-2 ring-violet-100"
                                  : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                              }`}
                            >
                              <span className="text-2xl mb-1 block">
                                {paymentMethods[method].icon}
                              </span>
                              <span className="text-sm font-medium">
                                {paymentMethods[method].name}
                              </span>
                            </button>
                          ))}
                        </div>

                        {form.formState.errors.method && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.method.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="senderNumber"
                    control={form.control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label
                          htmlFor="senderNumber"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Your Mobile Number
                        </label>
                        <input
                          {...field}
                          id="senderNumber"
                          type="tel"
                          disabled={isSubmitting}
                          placeholder="01XXXXXXXXX"
                          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                            form.formState.errors.senderNumber
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {form.formState.errors.senderNumber && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.senderNumber.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Enter the mobile number you used for payment
                        </p>
                      </div>
                    )}
                  />

                  <Controller
                    name="trxId"
                    control={form.control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label
                          htmlFor="trxId"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Transaction ID
                        </label>
                        <input
                          {...field}
                          id="trxId"
                          type="text"
                          disabled={isSubmitting}
                          placeholder="Enter transaction ID from SMS"
                          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                            form.formState.errors.trxId
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {form.formState.errors.trxId && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.trxId.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !enrollmentPeriodValid}
                    className="w-full mt-6 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" variant="white" />
                        <span className="ml-2">Submitting Payment...</span>
                      </>
                    ) : (
                      "Submit Payment"
                    )}
                  </button>
                </form>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Your payment will be verified within 24 hours
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden sticky top-6">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="h-4 w-4 text-violet-600" />
                  Payment Instructions
                </h2>
              </div>

              <div className="p-6">
                {showInstructions ? (
                  <div className="space-y-4">
                    <div className="bg-violet-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Send to this number:
                      </p>
                      <p className="text-lg font-bold text-violet-700">
                        {paymentMethods[watchedMethod].number}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Instructions:
                      </p>
                      <ol className="space-y-2">
                        {paymentMethods[watchedMethod].instructions.map(
                          (instruction, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 flex gap-2"
                            >
                              <span className="font-medium text-violet-600">
                                {index + 1}.
                              </span>
                              <span>
                                {instruction.replace(
                                  "{amount}",
                                  formatCurrency(enrollment.enrollmentFee),
                                )}
                              </span>
                            </li>
                          ),
                        )}
                      </ol>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-3 mt-4">
                      <p className="text-xs text-yellow-700">
                        <strong>⚠️ Important:</strong> Make sure to send the
                        exact amount and keep the transaction ID safe. We'll
                        verify your payment within 24 hours.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Select a payment method above to see instructions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
