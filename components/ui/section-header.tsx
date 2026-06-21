import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Shared section header: a colour bar + title (+ optional subtitle) on the lead
 * side, with an optional quiet "view all" text link on the trailing side.
 *
 * Design (per brand voice — quiet, editorial, restraint): the action is a plain
 * text link in ccm-water that underlines on hover. NO chevron/arrow icon — the
 * label carries it. Used across home, region, dashboard, case studies, news…
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
  /** Show the leading colour bar accent (default true). */
  bar?: boolean;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {bar && (
          <span
            aria-hidden="true"
            className="mt-1 h-6 w-1.5 shrink-0 rounded-full bg-ccm-water"
          />
        )}
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
          className="shrink-0 whitespace-nowrap text-sm font-medium text-ccm-water underline-offset-4 hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;
