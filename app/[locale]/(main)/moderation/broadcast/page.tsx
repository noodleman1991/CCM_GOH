import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getActor, isStaff } from "@/lib/authz";
import { FEATURES } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { BroadcastForm } from "@/components/notifications/broadcast-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "navigation" });
  return { title: t("broadcast") };
}

export default async function BroadcastPage() {
  const locale = await getLocale();
  const tMod = await getTranslations("moderation");
  if (!FEATURES.engagement) redirect({ href: "/", locale });
  const actor = await getActor();
  if (!isStaff(actor)) redirect({ href: "/", locale });

  const communities = await prisma.community.findMany({
    select: { id: true, name: true, type: true, regionalName: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-2 text-3xl font-heading font-bold text-ccm-midnight">{tMod("broadcast.title")}</h1>
      <p className="mb-6 text-muted-foreground">{tMod("broadcast.description")}</p>
      <BroadcastForm
        communities={communities.map((c) => ({ id: c.id, name: c.name, type: c.type, regionalName: c.regionalName }))}
      />
    </div>
  );
}
