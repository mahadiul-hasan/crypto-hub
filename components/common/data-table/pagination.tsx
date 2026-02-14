"use client";

import { cn } from "@/lib/utils";

interface DataTablePaginationProps {
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
}

export function DataTablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  loading,
}: DataTablePaginationProps) {
  const { page, pageSize, totalCount, totalPages } = pagination;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>Showing</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
          className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer disabled:opacity-50"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>of {totalCount} items</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || loading}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Previous
        </button>

        {getPageNumbers().map((p, index) => (
          <span key={index}>
            {p === "..." ? (
              <span className="px-2 py-1 text-gray-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange(p as number)}
                disabled={loading}
                className={cn(
                  "px-3 py-1 border rounded-lg text-sm transition-colors cursor-pointer",
                  page === p
                    ? "bg-violet-600 text-white border-violet-600 hover:bg-violet-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50",
                )}
              >
                {p}
              </button>
            )}
          </span>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || loading}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
