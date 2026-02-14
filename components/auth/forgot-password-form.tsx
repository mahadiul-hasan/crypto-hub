"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { forgotPasswordAction } from "@/actions/auth.actions";
import { useToast } from "@/context/ToastContext";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordForm() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [lastEmailTime, setLastEmailTime] = useState<number | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  // Load last email time from localStorage on component mount
  useEffect(() => {
    const storedTime = localStorage.getItem("lastResetEmailTime");
    if (storedTime) {
      const time = parseInt(storedTime);
      const now = Date.now();
      const timePassed = now - time;

      if (timePassed < 60000) {
        setLastEmailTime(time);
        const remaining = Math.ceil((60000 - timePassed) / 1000);
        setCountdown(remaining);
        setCanResend(false);
      }
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!canResend && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [canResend, countdown]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      await forgotPasswordAction(data.email);
      setIsSubmitted(true);
      setSubmittedEmail(data.email);

      // Store the time when email was sent
      const now = Date.now();
      setLastEmailTime(now);
      localStorage.setItem("lastResetEmailTime", now.toString());

      // Start countdown
      setCanResend(false);
      setCountdown(60);

      reset();
      showToast(
        "Reset link sent! Check your email for password reset instructions.",
        "success",
      );
    } catch (error) {
      // If error is about waiting, extract the time
      if (error instanceof Error && error.message.includes("Please wait")) {
        const match = error.message.match(/(\d+)/);
        if (match) {
          const seconds = parseInt(match[1]);
          setCountdown(seconds);
          setCanResend(false);

          // Store the time in localStorage
          const time = Date.now() - (60000 - seconds * 1000);
          setLastEmailTime(time);
          localStorage.setItem("lastResetEmailTime", time.toString());
        }
      }

      showToast(
        error instanceof Error ? error.message : "Failed to send reset link",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = () => {
    if (!submittedEmail) {
      showToast("Please submit your email first.", "error");
      return;
    }
    onSubmit({ email: submittedEmail });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-100">
          <h2 className="text-center text-2xl font-semibold text-gray-900">
            Forgot Password
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <p className="text-gray-700">
                  If an account exists with this email, you will receive
                  password reset instructions shortly.
                </p>

                {submittedEmail && (
                  <p className="text-sm text-gray-500">
                    Sent to:{" "}
                    <span className="font-medium text-gray-700">
                      {submittedEmail}
                    </span>
                  </p>
                )}
              </div>

              {/* Resend Button */}
              <button
                onClick={handleResend}
                disabled={!canResend || isSubmitting}
                className={`
                  w-full py-2.5 px-4 rounded-lg font-medium
                  border transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                  ${
                    !canResend || isSubmitting
                      ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-violet-600 border-violet-600 hover:bg-violet-50"
                  }
                `}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="animate-spin h-5 w-5 text-violet-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Sending...</span>
                  </div>
                ) : canResend ? (
                  "Send another reset link"
                ) : (
                  `Please wait ${formatTime(countdown)} for another retry`
                )}
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    disabled={isSubmitting || !canResend}
                    className={`
                      w-full px-3 py-2 border rounded-lg shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.email ? "border-red-500" : "border-gray-300"}
                    `}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !canResend}
                  className={`
                    w-full py-2.5 px-4 rounded-lg text-white font-medium
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                    transition-colors duration-200 cursor-pointer
                    ${
                      isSubmitting || !canResend
                        ? "bg-violet-400 cursor-not-allowed"
                        : "bg-violet-600 hover:bg-violet-700"
                    }
                  `}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Sending...</span>
                    </div>
                  ) : !canResend ? (
                    `Please wait ${formatTime(countdown)}`
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-violet-600 hover:text-violet-800 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
