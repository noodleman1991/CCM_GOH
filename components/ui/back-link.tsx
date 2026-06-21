import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Shared "back to X" link for detail pages. A quiet, muted text link with a small
 * leading chevron — an escape-hatch breadcrumb, not a button. One treatment used
 * everywhere (news, case study, lived experience…) for consistency. The chevron
 * mirrors automatically in RTL.
 */
export function BackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-0.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline",
        className
      )}
    >
      <ChevronLeft className="size-4 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
      {label}
    </Link>
  );
}

export default BackLink;
