// Server component for flexible date formatting
// NO "use client" directive - this is a server component

export function FormattedDate({
  date,
  locale,
  options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
}: {
  date: string;
  locale: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const formatted = new Intl.DateTimeFormat(locale, options).format(new Date(date));

  return (
    <time dateTime={date}>
      {formatted}
    </time>
  );
}

export default FormattedDate;
