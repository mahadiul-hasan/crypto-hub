"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DataTableProps } from "./types";
import { DataTableFilters } from "./filters";
import { DataTablePagination } from "./pagination";
import { ActionDropdown } from "./action-dropdown";
import { DeleteModal } from "./delete-modal";
import { cn } from "@/lib/utils";

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  filters = [],
  pagination,
  selectedIds: externalSelectedIds,
  currentUserId,
  idKey = "id" as keyof T,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  onPageChange,
  onPageSizeChange,
  onSelect: externalOnSelect,
  onDelete,
  loading = false,
  selectable = false,
  showFilters = true,
}: DataTableProps<T>) {
  // Internal selection state if not controlled externally
  const [internalSelectedIds, setInternalSelectedIds] = React.useState<
    Set<string>
  >(new Set());

  // Use external selection if provided, otherwise use internal
  const selectedIds =
    externalSelectedIds !== undefined
      ? externalSelectedIds
      : internalSelectedIds;

  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof T | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  const handleSort = (key: keyof T) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = () => {
    // Determine which set to update
    if (externalOnSelect) {
      // Controlled mode
      if (selectedIds.size === data.length) {
        externalOnSelect(new Set());
      } else {
        const allIds = new Set(data.map((item) => String(item[idKey])));
        externalOnSelect(allIds);
      }
    } else {
      // Uncontrolled mode
      if (selectedIds.size === data.length) {
        setInternalSelectedIds(new Set());
      } else {
        const allIds = new Set(data.map((item) => String(item[idKey])));
        setInternalSelectedIds(allIds);
      }
    }
  };

  const handleSelectItem = (id: string) => {
    // Determine which set to update
    if (externalOnSelect) {
      // Controlled mode
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      externalOnSelect(newSelected);
    } else {
      // Uncontrolled mode
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setInternalSelectedIds(newSelected);
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete && onDelete) {
      await onDelete([itemToDelete]);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      // Clear selection after delete
      if (!externalOnSelect) {
        setInternalSelectedIds(new Set());
      }
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (onDelete && selectedIds.size > 0) {
      await onDelete(Array.from(selectedIds));
      setBulkDeleteDialogOpen(false);
      // Clear selection after delete
      if (!externalOnSelect) {
        setInternalSelectedIds(new Set());
      }
    }
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (sortConfig.direction === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [data, sortConfig]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && filters.length > 0 && (
        <DataTableFilters
          filters={filters}
          onFilterChange={onFilterChange || (() => {})}
          onApplyFilters={onApplyFilters}
          onResetFilters={onResetFilters}
          selectedCount={selectedIds.size}
          onDeleteSelected={handleBulkDeleteClick}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {selectable && (
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === data.length && data.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </th>
                )}

                {columns.map((column) => (
                  <th key={String(column.key)} className="px-4 py-3 text-left">
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key as keyof T)}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 cursor-pointer"
                      >
                        <span>{column.header}</span>
                        {sortConfig.key === column.key &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column.header}
                      </span>
                    )}
                  </th>
                ))}

                {actions.length > 0 && <th className="w-12 px-4 py-3"></th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      columns.length +
                      (selectable ? 1 : 0) +
                      (actions.length > 0 ? 1 : 0)
                    }
                    className="px-4 py-8 text-center"
                  >
                    <div className="flex justify-center items-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"></div>
                      <span className="ml-3 text-gray-600">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.length +
                      (selectable ? 1 : 0) +
                      (actions.length > 0 ? 1 : 0)
                    }
                    className="px-4 py-8 text-center"
                  >
                    <p className="text-gray-500">No data found</p>
                  </td>
                </tr>
              ) : (
                sortedData.map((item) => {
                  const itemId = String(item[idKey]);
                  const isSelected = selectedIds.has(itemId);
                  const isCurrentUser = currentUserId === itemId;

                  return (
                    <tr
                      key={itemId}
                      className={cn(
                        "hover:bg-gray-50 transition-colors",
                        isSelected && "bg-violet-50/50",
                        isCurrentUser && "bg-violet-100",
                      )}
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectItem(itemId)}
                            disabled={isCurrentUser}
                            className={cn(
                              "rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer",
                              isCurrentUser && "opacity-50 cursor-not-allowed",
                            )}
                          />
                        </td>
                      )}

                      {columns.map((column) => (
                        <td key={String(column.key)} className="px-4 py-3">
                          {column.cell ? (
                            column.cell(item)
                          ) : (
                            <span className="text-sm text-gray-600">
                              {String(item[column.key as keyof T])}
                            </span>
                          )}
                        </td>
                      ))}

                      {actions.length > 0 && (
                        <td className="px-4 py-3">
                          <ActionDropdown
                            item={item}
                            actions={actions}
                            isDisabled={isCurrentUser}
                            onDeleteClick={() => handleDeleteClick(itemId)}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <DataTablePagination
        pagination={pagination}
        onPageChange={onPageChange || (() => {})}
        onPageSizeChange={onPageSizeChange || (() => {})}
        loading={loading}
      />

      {/* Single Delete Modal */}
      <DeleteModal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
      />

      {/* Bulk Delete Modal */}
      <DeleteModal
        isOpen={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${selectedIds.size} Users`}
        description={`Are you sure you want to delete ${selectedIds.size} users? This action cannot be undone.`}
      />
    </div>
  );
}
