export interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface Action<T> {
  label: string | ((item: T) => string);
  icon?: React.ReactNode | ((item: T) => React.ReactNode);
  onClick: (item: T) => void;
  disabled?: (item: T) => boolean;
  variant?: "default" | "danger";
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "search" | "select" | "date";
  options?: FilterOption[];
  placeholder?: string;
  value?: string; // Add value property
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  filters?: FilterConfig[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  selectedIds?: Set<string>;
  currentUserId?: string;
  idKey?: keyof T;
  onFilterChange?: (filters: Record<string, any>) => void;
  onApplyFilters?: () => void;
  onResetFilters?: () => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSelect?: (selectedIds: Set<string>) => void;
  onDelete?: (ids: string[]) => void;
  loading?: boolean;
  selectable?: boolean;
  showFilters?: boolean;
}
