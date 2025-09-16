import { cn } from "@/lib/utils";

interface SeparatorBlockProps {
  style?: "line" | "dashed" | "dotted" | "spacer" | "wave" | "decorative";
  spacing?: "small" | "medium" | "large" | "extra-large";
  color?: "light-gray" | "medium-gray" | "dark-gray" | "brand-primary" | "brand-secondary";
}

const spacingClasses = {
  small: "py-4",
  medium: "py-8",
  large: "py-12",
  "extra-large": "py-16",
};

const colorClasses = {
  "light-gray": "border-gray-200",
  "medium-gray": "border-gray-300",
  "dark-gray": "border-gray-400",
  "brand-primary": "border-primary",
  "brand-secondary": "border-secondary",
};

export function SeparatorBlock({
  style = "line",
  spacing = "medium",
  color = "light-gray",
}: SeparatorBlockProps) {
  const spacingClass = spacingClasses[spacing];
  const colorClass = colorClasses[color];

  if (style === "spacer") {
    return <div className={spacingClass} />;
  }

  return (
    <div className={cn("w-full", spacingClass)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {style === "line" && (
          <hr className={cn("border-t", colorClass)} />
        )}

        {style === "dashed" && (
          <hr className={cn("border-t border-dashed", colorClass)} />
        )}

        {style === "dotted" && (
          <hr className={cn("border-t border-dotted border-2", colorClass)} />
        )}

        {style === "wave" && (
          <div className="text-center">
            <svg
              className={cn("mx-auto h-2 w-20", colorClass.replace("border-", "text-"))}
              viewBox="0 0 80 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 4C10 0 20 8 30 4C40 0 50 8 60 4C70 0 80 8 80 4"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
        )}

        {style === "decorative" && (
          <div className="text-center">
            <div className={cn("inline-flex items-center space-x-2", colorClass.replace("border-", "text-"))}>
              <div className="w-12 h-px bg-current" />
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-current rounded-full" />
                <div className="w-1 h-1 bg-current rounded-full" />
                <div className="w-1 h-1 bg-current rounded-full" />
              </div>
              <div className="w-12 h-px bg-current" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}