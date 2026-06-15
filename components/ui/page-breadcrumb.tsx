import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

export type Crumb =
  | { href: string; label: string }
  | { label: string }; // current page (no link)

/**
 * A localized, locale-prefixed breadcrumb for dashboard/profile/account pages.
 *
 * Labels are passed already-resolved (callers usually mix navigation keys with
 * a page-specific title). Links use the next-intl `Link` so the active locale
 * is preserved on navigation — a plain `<a href="/">` would drop it. The last
 * crumb (no `href`) renders as the current page.
 *
 * Convenience: pass `withHome`/`withDashboard` to prepend the shared,
 * already-translated "Home" / "Dashboard" crumbs without repeating them.
 */
export async function PageBreadcrumb({
  items,
  withHome = true,
  withDashboard = false,
  className,
}: {
  items: Crumb[];
  withHome?: boolean;
  withDashboard?: boolean;
  className?: string;
}) {
  const t = await getTranslations("navigation");

  const trail: Crumb[] = [
    ...(withHome ? [{ href: "/", label: t("home") }] : []),
    ...(withDashboard ? [{ href: "/dashboard", label: t("dashboard") }] : []),
    ...items,
  ];

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              <BreadcrumbItem>
                {"href" in crumb && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
