"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { deleteOldNotificationsAction } from "@/actions/notification.actions";
import { Spinner } from "@/components/common/spinner";
import { useRouter } from "next/navigation";

export function CleanupNotificationsButton() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [daysOld, setDaysOld] = useState("7");

  const handleCleanup = async () => {
    setIsSubmitting(true);
    try {
      const result = await deleteOldNotificationsAction(parseInt(daysOld));
      showToast(result.message, "success");
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to clean up notifications", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
        <span>Cleanup Old Notifications</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-99999 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity cursor-pointer"
              onClick={() => !isSubmitting && setIsOpen(false)}
            />

            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Cleanup Old Notifications
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                This will permanently delete all notifications older than the
                selected period.
              </p>

              <div className="mb-6">
                <label
                  htmlFor="daysOld"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Delete notifications older than
                </label>
                <select
                  id="daysOld"
                  value={daysOld}
                  onChange={(e) => setDaysOld(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCleanup}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        size="sm"
                        variant="white"
                        dataIcon="inline-start"
                      />
                      <span>Cleaning...</span>
                    </>
                  ) : (
                    "Delete Old Notifications"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
