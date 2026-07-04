import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Shared section header: title (+ optional subtitle) on the lead side, with an
 * optional quiet "view all" text link on the trailing side.
 *
 * Design (per brand voice — quiet, editorial, restraint): typography carries
 * the hierarchy — the old vertical colour-bar accent was retired 2026-07-04
 * (user: "the vertical bubbles next to the title don't fit well"). The `bar`
 * prop is still accepted so existing call sites keep compiling, but it never
 * renders. The action is a plain text link in ccm-water that underlines on
 * hover; NO chevron — the label carries it.
 */
export function SectionHeader({
  title,
  subtitle,
  action,
  bar = true,
  className,
  titleClassName,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional trailing action: a "view all" link. */
  action?: { label: string; href: string };
  /** Deprecated — the bar accent was retired; accepted for compatibility. */
  bar?: boolean;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0">
          <h2 className={cn("font-heading text-xl font-bold text-balance text-ccm-midnight sm:text-2xl", titleClassName)}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <Link
          href={action.href}
          className="mt-1 shrink-0 whitespace-nowrap text-sm font-medium text-ccm-water underline-offset-4 hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;
