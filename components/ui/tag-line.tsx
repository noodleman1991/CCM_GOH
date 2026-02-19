import { cn } from "@/lib/utils";

export default function TagLine({
  title,
  element = "p",
  className,
}: {
  title: string;
  element?: "div" | "p";
  className?: string;
  large?: boolean;
}) {
  const TagElement = element;

  return (
    <TagElement
      className={cn(
        "inline-block text-base font-semibold",
        className
      )}
    >
      {title}
    </TagElement>
  );
}
