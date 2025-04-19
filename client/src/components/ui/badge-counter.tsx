import { cn } from "@/lib/utils";

interface BadgeCounterProps {
  count: number;
  variant?: "default" | "warning" | "danger" | "success";
  className?: string;
}

export function BadgeCounter({
  count,
  variant = "default",
  className,
}: BadgeCounterProps) {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800",
  };

  let selectedVariant = "default";
  
  if (count >= 3) {
    selectedVariant = "danger";
  } else if (count === 2) {
    selectedVariant = "warning";
  } else if (count === 1) {
    selectedVariant = "success";
  }

  return (
    <span
      className={cn(
        "text-sm py-1 px-2 rounded-full",
        variantClasses[variant || selectedVariant],
        className
      )}
    >
      {count} {count === 1 ? "relatório" : "relatórios"}
    </span>
  );
}
