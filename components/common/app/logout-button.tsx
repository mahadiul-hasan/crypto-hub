"use client";

import { logoutAction } from "@/actions/auth.actions";
import { redirect } from "next/navigation";
import { useToast } from "@/context/ToastContext";

interface LogoutButtonProps {
  variant?: "desktop" | "mobile";
  onClose?: () => void;
}

export function LogoutButton({
  variant = "desktop",
  onClose,
}: LogoutButtonProps) {
  const { showToast } = useToast();

  const handleLogout = async () => {
    const response = await logoutAction();
    if (!response.success) {
      showToast("Something went wrong, Please try again later", "error");
    }
    showToast(response.message, "success");
    onClose?.();
    redirect("/");
  };

  if (variant === "desktop") {
    return (
      <button
        onClick={handleLogout}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed  cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
          />
        </svg>
        <span>Logout</span>
      </button>
    );
  }

  // Mobile variant
  return (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-2 text-center text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
        />
      </svg>
      <span>Logout</span>
    </button>
  );
}
