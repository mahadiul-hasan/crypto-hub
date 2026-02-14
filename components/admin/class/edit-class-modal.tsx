"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { updateClassAction } from "@/actions/class.actions";
import { Spinner } from "@/components/common/spinner";
import { SessionStatus } from "@/lib/generated/prisma/enums";

type ClassSession = {
  id: string;
  title: string;
  meetingUrl: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  batch: {
    id: string;
    name: string;
  };
};

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassSession;
  batches: { id: string; name: string }[];
  onSuccess: () => void;
}

export function EditClassModal({
  isOpen,
  onClose,
  classData,
  batches,
  onSuccess,
}: EditClassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: classData.title,
    meetingUrl: classData.meetingUrl,
    startsAt: classData.startsAt.slice(0, 16),
    endsAt: classData.endsAt.slice(0, 16),
    status: classData.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateClassAction(classData.id, {
        title: formData.title,
        meetingUrl: formData.meetingUrl,
        startsAt: new Date(formData.startsAt),
        endsAt: new Date(formData.endsAt),
        status: formData.status,
      });

      showToast("Class updated successfully!", "success");
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(error.message || "Failed to update class", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity cursor-pointer"
          onClick={() => !isSubmitting && onClose()}
        />

        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Edit Class</h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch
              </label>
              <input
                type="text"
                value={classData.batch.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Class Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="meetingUrl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Meeting URL
              </label>
              <input
                type="url"
                id="meetingUrl"
                value={formData.meetingUrl}
                onChange={(e) =>
                  setFormData({ ...formData, meetingUrl: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startsAt"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  id="startsAt"
                  value={formData.startsAt}
                  onChange={(e) =>
                    setFormData({ ...formData, startsAt: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="endsAt"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Time
                </label>
                <input
                  type="datetime-local"
                  id="endsAt"
                  value={formData.endsAt}
                  onChange={(e) =>
                    setFormData({ ...formData, endsAt: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as SessionStatus,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Spinner
                      size="sm"
                      variant="white"
                      dataIcon="inline-start"
                    />
                    <span>Updating...</span>
                  </>
                ) : (
                  "Update Class"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
