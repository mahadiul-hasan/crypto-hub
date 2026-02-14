"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOffIcon, Lock, KeyRound, LogOut } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { changePasswordAction } from "@/actions/user.action";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = form;

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);

    try {
      const result = await changePasswordAction(
        data.currentPassword,
        data.newPassword,
      );

      if (result.success) {
        showToast(
          "Password changed successfully! You'll be logged out.",
          "success",
        );

        reset();

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (error: any) {
      let errorMessage = "Failed to change password";

      if (error instanceof Error) {
        if (error.message.toLowerCase().includes("wrong password")) {
          errorMessage = "Current password is incorrect";
          setError("currentPassword", {
            type: "manual",
            message: "Incorrect password",
          });
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
    <div className="px-6 py-4">
      {/* Header - Clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-400 group-hover:text-violet-600" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-violet-600">
            Change Password
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Expanded Form */}
      {isExpanded && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Current Password */}
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label
                  htmlFor="currentPassword"
                  className="block text-xs font-medium text-gray-600"
                >
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...field}
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="Enter current password"
                    className={`
                      w-full pl-10 pr-10 py-2 text-sm border rounded-lg shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.currentPassword ? "border-red-500" : "border-gray-300"}
                    `}
                    aria-invalid={!!errors.currentPassword}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                  >
                    {showPasswords.current ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOffIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* New Password */}
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="block text-xs font-medium text-gray-600"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...field}
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="Enter new password"
                    className={`
                      w-full pl-10 pr-10 py-2 text-sm border rounded-lg shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.newPassword ? "border-red-500" : "border-gray-300"}
                    `}
                    aria-invalid={!!errors.newPassword}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                  >
                    {showPasswords.new ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOffIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
                {errors.newPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Confirm Password */}
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-gray-600"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...field}
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="Confirm new password"
                    className={`
                      w-full pl-10 pr-10 py-2 text-sm border rounded-lg shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}
                    `}
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                  >
                    {showPasswords.confirm ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOffIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Warning Message */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <LogOut className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              After changing your password, you'll be logged out from all
              devices. You'll need to log in again with your new password.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full py-2 px-4 rounded-lg text-white text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
              transition-colors duration-200 cursor-pointer
              ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-violet-600 hover:bg-violet-700"
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Changing Password...
              </div>
            ) : (
              "Change Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
