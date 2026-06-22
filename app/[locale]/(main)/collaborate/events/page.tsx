import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FEATURES } from "@/lib/features";
import { fetchApprovedEvents } from "@/lib/events";
import { EventCard } from "@/components/events/event-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return { title: t("title") };
}

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!FEATURES.engagement) redirect("/");
  const { locale } = await params;
  const { userId } = await auth();
  const t = await getTranslations({ locale, namespace: "events" });

  const events = await fetchApprovedEvents();
  const labels = {
    community: t("scopeCommunity"),
    project: t("scopeProject"),
    modeOnline: t("modeOnline"),
    modeInPerson: t("modeInPerson"),
    modeHybrid: t("modeHybrid"),
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-ccm-midnight">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        {userId && (
          <Button asChild className="gap-2">
            <Link href="/collaborate/events/new">
              <Plus className="size-4" />
              {t("submit")}
            </Link>
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">{t("empty")}</Card>
      ) : (
        <div className="space-y-4">
          {events.map((e) => (
            <EventCard key={e._id} event={e} signedIn={!!userId} labels={labels} />
          ))}
        </div>
      )}
    </div>
  );
}
