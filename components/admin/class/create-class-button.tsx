"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { createClassAction } from "@/actions/class.actions";
import { Spinner } from "@/components/common/spinner";
import { useRouter } from "next/navigation";

interface CreateClassButtonProps {
  batches: { id: string; name: string }[];
}

export function CreateClassButton({ batches }: CreateClassButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    batchId: "",
    title: "",
    meetingUrl: "",
    startsAt: "",
    endsAt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createClassAction({
        batchId: formData.batchId,
        title: formData.title,
        meetingUrl: formData.meetingUrl,
        startsAt: new Date(formData.startsAt),
        endsAt: new Date(formData.endsAt),
      });

      showToast("Class created successfully!", "success");
      setIsOpen(false);
      setFormData({
        batchId: "",
        title: "",
        meetingUrl: "",
        startsAt: "",
        endsAt: "",
      });
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to create class", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Create Class</span>
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
                  Create New Class
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="batchId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Batch
                  </label>
                  <select
                    id="batchId"
                    value={formData.batchId}
                    onChange={(e) =>
                      setFormData({ ...formData, batchId: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="">Select a batch</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
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
                    placeholder="e.g., Bitcoin Fundamentals - Week 1"
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
                    placeholder="https://meet.google.com/..."
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

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
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
                        <span>Creating...</span>
                      </>
                    ) : (
                      "Create Class"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
