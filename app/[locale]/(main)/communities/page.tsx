import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import {
  REGION_CODES,
  REGION_COLOR,
  REGION_I18N_KEY,
  REGION_TO_RC_SLUG,
} from "@/lib/maps/region-codes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "communitiesIndex" });
  return { title: t("pageTitle"), description: t("pageDescription") };
}

export default async function CommunitiesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "communitiesIndex" });
  const tRegions = await getTranslations({
    locale,
    namespace: "navigation.regions",
  });

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">{t("pageDescription")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REGION_CODES.map((code) => (
          <Link
            key={code}
            href={`/communities/${REGION_TO_RC_SLUG[code]}`}
            className="group"
          >
            <Card className="flex h-full items-center gap-4 overflow-hidden p-5 transition-shadow hover:shadow-md">
              <span
                className="h-10 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: REGION_COLOR[code] }}
                aria-hidden
              />
              <span className="flex-1 font-medium leading-snug group-hover:underline">
                {tRegions(REGION_I18N_KEY[code])}
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                aria-hidden
              />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
