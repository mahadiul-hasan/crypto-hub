import { cn } from "@/lib/utils";

export type StatusVariant =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "default";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-green-100 text-green-800",
  info: "bg-blue-100 text-blue-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800",
};

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "px-2 py-1 rounded-full text-xs font-medium inline-block",
        variantStyles[variant],
      )}
    >
      {status}
    </span>
  );
}
