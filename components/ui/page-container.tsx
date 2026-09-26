import { cn } from "@/lib/utils";

/**
 * Shared wrapper for static content pages (news, lived experiences, case
 * studies, collaborate, about, …). Gives a uniform centred width plus a bit
 * MORE horizontal breathing room on large screens so content isn't flush
 * against the sidebar when it's open. Use in place of ad-hoc
 * `container mx-auto py-8 px-4` wrappers.
 */
export function PageContainer({
  children,
  className,
  width = "max-w-6xl",
}: {
  children: React.ReactNode;
  className?: string;
  /** Content max-width (defaults to the site-standard max-w-6xl). */
  width?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full py-8",
        // Progressive horizontal margin: comfortable on mobile, more generous on
        // lg/xl so the content breathes next to the open sidebar.
        "px-4 sm:px-6 lg:px-10 xl:px-16",
        width,
        className
      )}
    >
      {children}
    </div>
  );
}
