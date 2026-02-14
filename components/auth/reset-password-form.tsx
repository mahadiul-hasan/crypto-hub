"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOffIcon, Lock } from "lucide-react";
import { resetPasswordAction } from "@/actions/auth.actions";
import { useToast } from "@/context/ToastContext";

const formSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!token) {
      showToast(
        "Invalid reset link. Please request a new password reset link.",
        "error",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPasswordAction(token, data.password);

      if (!response.success) {
        showToast("Something went wrong, Please try again later", "warning");
      }

      showToast(response.message, "success");

      reset();
      router.push("/auth/login");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password";
      const isExpired = errorMessage.toLowerCase().includes("expired");
      const isInvalid = errorMessage.toLowerCase().includes("invalid");

      if (isExpired) {
        showToast(
          "Reset link expired. Please request a new password reset link.",
          "error",
        );
      } else if (isInvalid) {
        showToast(
          "Invalid reset link. Please request a new password reset link.",
          "error",
        );
      } else {
        showToast(errorMessage, "error");
      }

      // Clear passwords on error
      reset({ password: "", confirmPassword: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-8 text-center border-b border-gray-100">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-sm text-gray-500">No reset token provided</p>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-center text-gray-600">
              This password reset link appears to be invalid. Please request a
              new one.
            </p>

            <div className="space-y-3">
              <Link
                href="/auth/forgot-password"
                className="block w-full py-2.5 px-4 rounded-lg text-center font-medium
                  bg-violet-600 text-white hover:bg-violet-700 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/auth/login"
                className="block w-full py-2.5 px-4 rounded-lg text-center font-medium
                  bg-white text-violet-600 border border-violet-600 hover:bg-violet-50 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 text-center border-b border-gray-100">
          <div className="mx-auto w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Reset Your Password
          </h2>
          <p className="text-sm text-gray-500">Enter your new password below</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder="Enter new password"
                  disabled={isSubmitting}
                  className={`
                    w-full px-3 py-2 border rounded-lg shadow-sm pr-10
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.password ? "border-red-500" : "border-gray-300"}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordVisible ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOffIcon size={18} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  id="confirmPassword"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  placeholder="Confirm new password"
                  disabled={isSubmitting}
                  className={`
                    w-full px-3 py-2 border rounded-lg shadow-sm pr-10
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}
                  `}
                />
                <button
                  type="button"
                  onClick={() =>
                    setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={
                    isConfirmPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isConfirmPasswordVisible ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOffIcon size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-2.5 px-4 rounded-lg text-white font-medium mt-6
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
                  <span>Resetting Password...</span>
                </div>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
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
