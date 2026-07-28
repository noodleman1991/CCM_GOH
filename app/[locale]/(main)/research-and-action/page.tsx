import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  FileStack,
  FileText,
  Globe,
  Lightbulb,
  MapPin,
  Users,
} from "lucide-react";

/** Sections mirror the app-sidebar's Research & Action group (same
 *  `navigation.*` label keys and URLs) plus the two code-routed collections. */
const SECTIONS = [
  { key: "globalAgenda", url: "/research-and-action/global-agenda", icon: Globe },
  { key: "regionalAgendas", url: "/research-and-action/regional-agendas", icon: MapPin },
  { key: "communityAgendas", url: "/research-and-action/community-agendas", icon: Users },
  { key: "allOutputs", url: "/research-and-action/all-outputs", icon: FileText },
  { key: "caseStudies", url: "/research-and-action/case-studies", icon: BookOpen },
  { key: "researchOutputs", url: "/research-and-action/research-outputs", icon: FileStack },
  { key: "toolkits", url: "/research-and-action/toolkits", icon: Lightbulb },
  { key: "impactReports", url: "/research-and-action/impact-reports", icon: BarChart3 },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "navigation" });
  const t = await getTranslations({ locale, namespace: "researchAndAction" });
  return { title: tNav("researchAction"), description: t("pageDescription") };
}

export default async function ResearchAndActionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "navigation" });
  const t = await getTranslations({ locale, namespace: "researchAndAction" });

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          {tNav("researchAction")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">{t("pageDescription")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(({ key, url, icon: Icon }) => (
          <Link key={key} href={url} className="group">
            <Card className="flex h-full items-center gap-4 p-5 transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <span className="flex-1 font-medium leading-snug group-hover:underline">
                {tNav(key)}
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
