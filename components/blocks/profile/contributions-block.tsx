import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Briefcase, Newspaper } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getUserContributions } from "@/lib/community/region-data";
import type { ContributionKind } from "@/lib/community/contributions";

const KIND_META: Record<ContributionKind, { icon: typeof FileText; labelKey: string }> = {
  caseStudy: { icon: FileText, labelKey: "caseStudy" },
  content: { icon: Newspaper, labelKey: "content" },
  recentWork: { icon: Briefcase, labelKey: "recentWork" },
};

/**
 * Surfaces a user's contributions (approved case studies, content, recent work)
 * on their public profile — the "what they've contributed" layer of the
 * community graph. Server component; renders nothing if there's nothing to show.
 */
export async function ContributionsBlock({
  userId,
  locale,
}: {
  userId: string;
  locale: string;
}) {
  const contributions = await getUserContributions(userId, locale);
  if (contributions.length === 0) return null;

  const t = await getTranslations("profile.contributions");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-ccm-midnight">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {contributions.slice(0, 8).map((c) => {
            const meta = KIND_META[c.kind];
            const Icon = meta.icon;
            const inner = (
              <span className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-ccm-sky)]/30 text-[var(--color-ccm-sea)]">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{c.title}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[11px] font-normal">
                      {t(`kind.${meta.labelKey}`)}
                    </Badge>
                    {c.date && (
                      <time dateTime={c.date}>
                        {new Date(c.date).toLocaleDateString(locale, {
                          year: "numeric",
                          month: "short",
                        })}
                      </time>
                    )}
                  </span>
                </span>
              </span>
            );
            return (
              <li key={`${c.kind}-${c.id}`}>
                {c.href ? (
                  <Link
                    href={c.href}
                    className="block rounded-lg p-2 -m-2 transition-colors hover:bg-muted"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="p-2 -m-2">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
