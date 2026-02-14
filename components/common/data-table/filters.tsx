"use client";

import { useState, useEffect } from "react";
import { Filter, Search, Trash2, X } from "lucide-react";
import { FilterConfig } from "./types";
import { cn } from "@/lib/utils";

interface DataTableFiltersProps {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, any>) => void;
  onApplyFilters?: () => void;
  onResetFilters?: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
}

export function DataTableFilters({
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  selectedCount,
  onDeleteSelected,
}: DataTableFiltersProps) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  // Initialize filter values from props
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    filters.forEach((filter) => {
      if (filter.value !== undefined) {
        initialValues[filter.key] = filter.value;
      }
    });
    setFilterValues(initialValues);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    const newValues = { ...filterValues, [key]: value };
    setFilterValues(newValues);
    onFilterChange(newValues);
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  const handleReset = () => {
    setFilterValues({});
    if (onResetFilters) {
      onResetFilters();
    }
    onFilterChange({});
  };

  const removeFilter = (key: string) => {
    const newValues = { ...filterValues };
    delete newValues[key];
    setFilterValues(newValues);
    onFilterChange(newValues);
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filterValues).length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-end mb-4">
        {selectedCount > 0 && (
          <button
            onClick={onDeleteSelected}
            className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Selected ({selectedCount})</span>
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          {filters.map((filter) => (
            <div key={filter.key} className="flex-1 min-w-50">
              {filter.type === "search" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={
                      filter.placeholder || `Search by ${filter.label}...`
                    }
                    value={filterValues[filter.key] || ""}
                    onChange={(e) =>
                      handleFilterChange(filter.key, e.target.value)
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleApply()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-text"
                  />
                </div>
              )}

              {filter.type === "select" && filter.options && (
                <select
                  value={filterValues[filter.key] || "all"}
                  onChange={(e) =>
                    handleFilterChange(
                      filter.key,
                      e.target.value === "all" ? undefined : e.target.value,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors cursor-pointer"
            >
              Apply Filters
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2">
            {Object.entries(filterValues).map(([key, value]) => {
              const filter = filters.find((f) => f.key === key);
              if (!filter || !value) return null;

              return (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-violet-100 text-violet-800"
                >
                  {filter.label}: {value}
                  <button
                    onClick={() => removeFilter(key)}
                    className="ml-2 hover:text-violet-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
