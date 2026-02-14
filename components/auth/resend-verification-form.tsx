"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { resendVerificationAction } from "@/actions/auth.actions";
import { useToast } from "@/context/ToastContext";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ResendVerificationForm() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      await resendVerificationAction(data.email);
      setIsSubmitted(true);
      showToast(
        "Verification email sent! Please check your inbox and spam folder.",
        "success",
      );
    } catch (error) {
      let errorMessage = "Failed to resend verification email.";

      if (error instanceof Error) {
        if (error.message.includes("already verified")) {
          errorMessage = "Account is already verified. Please try logging in.";
        } else if (error.message.includes("User not found")) {
          errorMessage = "No account found with this email.";
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-100">
          <h2 className="text-center text-2xl font-semibold text-gray-900">
            Resend Verification Email
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

              <p className="text-gray-700">
                If an account exists with this email and is not verified, you
                will receive verification instructions shortly.
              </p>

              {/* Send Another Button */}
              <button
                onClick={() => setIsSubmitted(false)}
                className="
                  w-full py-2.5 px-4 rounded-lg font-medium
                  bg-white text-violet-600 border border-violet-600
                  hover:bg-violet-50 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                "
              >
                Send another verification email
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Enter your email address to receive a new verification link.
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  className={`
                    w-full py-2.5 px-4 rounded-lg text-white font-medium
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                    transition-colors duration-200 cursor-pointer
                    ${
                      isSubmitting
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
                  ) : (
                    "Send Verification Email"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2 text-center">
          <Link
            href="/auth/login"
            className="block text-sm text-violet-600 hover:text-violet-800 hover:underline"
          >
            Back to Login
          </Link>
          <p className="text-sm text-gray-500">
            Need to create an account?{" "}
            <Link
              href="/auth/signup"
              className="text-violet-600 hover:text-violet-800 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
