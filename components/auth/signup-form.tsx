"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOffIcon } from "lucide-react";
import { signUpAction } from "@/actions/auth.actions";
import { useToast } from "@/context/ToastContext";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function SignupForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    setValue,
  } = form;

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const res = await signUpAction(data);

      if (res) {
        showToast(
          "Account created successfully! Please check your email and verify your account before logging in.",
          "success",
        );

        // Reset form on success
        reset();

        // Wait a moment so user can see the success message
        setTimeout(() => {
          router.push("/auth/login?from=signup");
        }, 2000);
      }
    } catch (error) {
      // Handle specific error messages
      let errorMessage = "Signup failed. Please try again.";

      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes("email exists")) {
          errorMessage = "An account with this email already exists.";
          setError("email", {
            type: "manual",
            message: "Email already registered",
          });
        } else if (message.includes("daily email limit")) {
          errorMessage =
            "Daily email limit reached. Please try again tomorrow.";
        } else if (message.includes("please wait")) {
          // Rate limit error - show the exact message
          errorMessage = error.message;
        } else if (message.includes("system email quota")) {
          errorMessage =
            "System temporarily unavailable. Please try again later.";
        } else {
          // For other errors, show a generic message
          errorMessage = "Unable to create account. Please check your details.";
        }

        // Reset password on error for security
        setValue("password", "", { shouldValidate: false });
      }

      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full sm:max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-8 border-b border-gray-100">
        <h2 className="text-center text-2xl font-semibold text-gray-900">
          Create Account
        </h2>
      </div>

      {/* Content */}
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  {...field}
                  id="name"
                  type="text"
                  disabled={isSubmitting}
                  placeholder="John Doe"
                  className={`
                    w-full px-3 py-2 border rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.name ? "border-red-500" : "border-gray-300"}
                  `}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
            )}
          />

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
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
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
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
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
                <span>Creating Account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-violet-600 hover:text-violet-800 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
