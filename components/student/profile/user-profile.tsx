"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Mail, Phone, User as UserIcon, Save, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { updateProfileAction } from "@/actions/user.action";
import { ChangePasswordForm } from "./change-password-form";

const profileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfileProps {
  initialData: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    isVerified: boolean;
    createdAt: string;
  };
}

export function UserProfile({ initialData }: UserProfileProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone || "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = form;

  const onSubmit = async (data: ProfileFormData) => {
    if (!isDirty) {
      showToast("No changes to save", "info");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateProfileAction({
        name: data.name,
        phone: data.phone || undefined,
      });

      if (result.success) {
        showToast("Profile updated successfully", "success");
        reset(data); // Reset form with new data
        router.refresh();
      }
    } catch (error: any) {
      showToast(error.message || "Failed to update profile", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset({
      name: initialData.name,
      phone: initialData.phone || "",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">
          Personal Information
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Update your personal details
        </p>
      </div>

      {/* Form */}
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
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...field}
                    id="name"
                    type="text"
                    disabled={isSubmitting}
                    placeholder="John Doe"
                    className={`
                      w-full pl-10 pr-3 py-2 border rounded-lg shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.name ? "border-red-500" : "border-gray-300"}
                    `}
                    aria-invalid={!!errors.name}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Email Field (Read-only) */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={initialData.email}
                disabled
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Phone Field */}
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...field}
                    id="phone"
                    type="tel"
                    disabled={isSubmitting}
                    placeholder="+880 1XXX-XXXXXX"
                    value={field.value || ""}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}
          />

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                transition-colors duration-200 cursor-pointer
                ${
                  isSubmitting || !isDirty
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700"
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>

            {isDirty && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="border-t border-gray-200">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
