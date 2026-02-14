"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOffIcon } from "lucide-react";
import { loginAction } from "@/actions/auth.actions";
import { useToast } from "@/context/ToastContext";

const formSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function LoginForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const res = await loginAction(data);

      if (res) {
        showToast("Login successful", "success");
        router.push("/");
      }
    } catch (error) {
      // Handle specific error messages
      let errorMessage = "Login failed. Please try again.";

      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes("invalid")) {
          errorMessage = "Invalid email or password.";
        } else if (message.includes("verify email")) {
          errorMessage = "Please verify your email before logging in.";
        } else if (
          message.includes("inactive") ||
          message.includes("verify your email")
        ) {
          errorMessage =
            "Your account is not verified. Please check your email.";
        } else {
          errorMessage = error.message;
        }
      }

      // Clear password on error for security
      form.setValue("password", "", { shouldValidate: false });

      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="w-full sm:max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-8 border-b border-gray-100">
        <h2 className="text-center text-2xl font-semibold text-gray-900">
          Login
        </h2>
      </div>

      {/* Content */}
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  {...field}
                  id="email"
                  type="email"
                  disabled={isSubmitting}
                  placeholder="example@gmail.com"
                  className={`
                    w-full px-3 py-2 border rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.email ? "border-red-500" : "border-gray-300"}
                  `}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Password Field */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-violet-600 hover:text-violet-800 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...field}
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="Enter password"
                    className={`
                      w-full px-3 py-2 border rounded-lg shadow-sm pr-10
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.password ? "border-red-500" : "border-gray-300"}
                    `}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
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
              </div>
            )}
          />

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
                <span>Logging in...</span>
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-violet-600 hover:text-violet-800 hover:underline"
          >
            Sign up
          </Link>
        </p>
        <p className="text-center text-sm text-gray-600">
          Didn't receive verification email?{" "}
          <Link
            href="/auth/resend-verification"
            className="font-medium text-violet-600 hover:text-violet-800 hover:underline"
          >
            Resend verification
          </Link>
        </p>
      </div>
    </div>
  );
}
