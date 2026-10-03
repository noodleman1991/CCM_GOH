import { redirect } from "@/i18n/navigation";

/** Suggesting an event moved to /events/suggest (events spec §3.2); old links keep their workspace/edit context. */
export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string; edit?: string }>;
}) {
  const { locale } = await params;
  const { workspace, edit } = await searchParams;
  const qs = new URLSearchParams({ ...(workspace ? { workspace } : {}), ...(edit ? { edit } : {}) }).toString();
  redirect({ href: `/events/suggest${qs ? `?${qs}` : ""}`, locale });
}
