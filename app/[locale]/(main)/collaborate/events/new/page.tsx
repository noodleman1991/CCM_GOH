import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/ui/back-link";
import { FEATURES } from "@/lib/features";
import { EventSubmitForm } from "@/components/events/event-submit-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return { title: t("submit") };
}

export default async function NewEventPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!FEATURES.engagement) redirect("/");
  const { locale } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const t = await getTranslations({ locale, namespace: "events" });

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <BackLink href="/collaborate/events" label={t("title")} />
      <h1 className="text-3xl font-heading font-bold tracking-tight text-ccm-midnight">{t("submit")}</h1>
      <EventSubmitForm />
    </div>
  );
}
