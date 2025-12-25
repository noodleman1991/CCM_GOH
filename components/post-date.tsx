// Server component - NO "use client"

export default function PostDate({
  date,
  locale = "en"
}: {
  date: string;
  locale?: string;
}) {
  // Format on server - same result on client
  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

  return (
    <time dateTime={date}>
      {formattedDate}
    </time>
  );
}
