import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "white";
  className?: string;
  dataIcon?: "inline-start" | "inline-end" | "center";
}

export function Spinner({
  size = "md",
  variant = "primary",
  className = "",
  dataIcon,
}: SpinnerProps) {
  // Size mappings
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
    xl: "h-12 w-12 border-4",
  };

  // Variant mappings
  const variantClasses = {
    primary: "border-violet-200 border-t-violet-600",
    secondary: "border-gray-200 border-t-gray-600",
    white: "border-white/30 border-t-white",
  };

  // Inline positioning
  const getPositionClass = () => {
    switch (dataIcon) {
      case "inline-start":
        return "mr-2 inline-block";
      case "inline-end":
        return "ml-2 inline-block";
      case "center":
        return "mx-auto block";
      default:
        return "inline-block";
    }
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        getPositionClass(),
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Full page loader variant
export function PageSpinner() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
        <Spinner size="xl" variant="primary" />
        <p className="mt-4 text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Overlay spinner for sections
export function SectionSpinner() {
  return (
    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
      <Spinner size="lg" variant="primary" />
    </div>
  );
}

// Inline spinner with text
export function InlineSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Spinner size="sm" variant="primary" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}
