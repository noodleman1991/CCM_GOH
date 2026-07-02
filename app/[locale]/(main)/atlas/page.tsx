import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { getThemeOptions } from "@/lib/maps/themes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "atlas" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: { title: t("title"), description: t("description"), type: "website" },
  };
}

export default async function AtlasPage() {
  const themes = await getThemeOptions();
  return (
    <div className="container max-w-6xl py-8">
      <Suspense fallback={null}>
        <AtlasExplorer themes={themes} />
      </Suspense>
    </div>
  );
}
