"use client";

import { formatDistanceToNow } from "date-fns";
import { useLocale } from "next-intl";
import { dateLocale } from "@/lib/date-locales";

/**
 * "3 days ago" in the member's language (Slice 14a). The one place
 * `formatDistanceToNow` is called from a component; the guard test keeps it
 * that way. Renders a <time> with the machine-readable instant.
 */
export function RelativeTime({
  date,
  addSuffix = true,
  className,
}: {
  date: string | number | Date;
  addSuffix?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return (
    <time dateTime={value.toISOString()} className={className}>
      {formatDistanceToNow(value, { addSuffix, locale: dateLocale(locale) })}
    </time>
  );
}
