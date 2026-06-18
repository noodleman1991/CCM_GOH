import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { getUserSettings, listBlockedUsers } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/settings/settings-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: t("title") };
}

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const t = await getTranslations("settings");
  const [settings, blocked] = await Promise.all([getUserSettings(), listBlockedUsers()]);
  if (!settings) redirect("/sign-in");

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-6 text-3xl font-heading font-bold text-ccm-midnight">{t("title")}</h1>
      <SettingsForm initial={settings} blocked={blocked} />
    </div>
  );
}
