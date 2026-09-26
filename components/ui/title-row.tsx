import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A heading that shares its row with something rigid — an Edit button, a
 * badge, a count — without ever pushing it off-screen (Slice 13b, audit P1).
 * The title may shrink (`min-w-0`), breaks unbroken words, clamps to two lines
 * and carries its full text in `title`; the trailing slot never shrinks.
 */
export function TitleRow({
  as: Tag = "h2",
  children,
  trailing,
  className,
  titleClassName,
  lines = 2,
  text,
}: {
  as?: ElementType;
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
  titleClassName?: string;
  /** How many lines the title may take before clamping (1–3). */
  lines?: 1 | 2 | 3;
  /** The plain text for the `title` tooltip, when children are not a plain string. */
  text?: string;
}) {
  const plain = text ?? (typeof children === "string" ? children : undefined);
  const clamp = lines === 1 ? "line-clamp-1" : lines === 3 ? "line-clamp-3" : "line-clamp-2";
  return (
    <div className={cn("flex min-w-0 items-start justify-between gap-2", className)}>
      <Tag className={cn("min-w-0 flex-1 break-words", clamp, titleClassName)} title={plain}>
        {children}
      </Tag>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
