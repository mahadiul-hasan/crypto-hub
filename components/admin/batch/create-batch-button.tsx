"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { createBatchAction } from "@/actions/batch.actions";
import { Spinner } from "@/components/common/spinner";
import { useRouter } from "next/navigation";

export function CreateBatchButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    seats: "",
    enrollStart: "",
    enrollEnd: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createBatchAction({
        name: formData.name,
        price: parseFloat(formData.price),
        seats: parseInt(formData.seats),
        enrollStart: new Date(formData.enrollStart),
        enrollEnd: new Date(formData.enrollEnd),
      });

      showToast("Batch created successfully!", "success");
      setIsOpen(false);
      setFormData({
        name: "",
        price: "",
        seats: "",
        enrollStart: "",
        enrollEnd: "",
      });
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to create batch", "error");
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
        <span>Create Batch</span>
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
                  Create New Batch
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
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Batch Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="e.g., Bitcoin Fundamentals"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Price (BDT)
                    </label>
                    <input
                      type="number"
                      id="price"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="2999"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="seats"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Total Seats
                    </label>
                    <input
                      type="number"
                      id="seats"
                      value={formData.seats}
                      onChange={(e) =>
                        setFormData({ ...formData, seats: e.target.value })
                      }
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="enrollStart"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Enrollment Start
                    </label>
                    <input
                      type="datetime-local"
                      id="enrollStart"
                      value={formData.enrollStart}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enrollStart: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="enrollEnd"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Enrollment End
                    </label>
                    <input
                      type="datetime-local"
                      id="enrollEnd"
                      value={formData.enrollEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, enrollEnd: e.target.value })
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
                      "Create Batch"
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
