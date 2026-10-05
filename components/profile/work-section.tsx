import { getTranslations } from "next-intl/server";
import Markdown from "react-markdown";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { RecentWorkOwnerControls } from "@/components/profile/recent-work-owner-controls";
import type { ProfileLink } from "@/lib/profile/sections";
import { cn } from "@/lib/utils";
import { OwnerAddLink, ProfileSection, SubHeading } from "./owner-add-link";

// Map the stored enum values to the camelCase translation keys.
const WORK_TYPE_KEY: Record<string, string> = {
  RESEARCH: "research",
  POLICY: "policy",
  LIVED_EXPERIENCE_EXPERT: "livedExperience",
  NGO: "ngo",
  COMMUNITY_ORGANIZATION: "communityOrg",
  EDUCATION_TEACHING: "education",
};
const EXPERTISE_KEY: Record<string, string> = {
  CLIMATE_CHANGE: "climate",
  MENTAL_HEALTH: "mentalHealth",
  HEALTH: "health",
  EDUCATION: "education",
  SOCIAL_JUSTICE: "socialJustice",
};

type RecentWork = {
  id: string;
  title: string;
  description: string;
  link?: string | null;
  isOngoing: boolean;
  startDate: Date;
  endDate?: Date | null;
  // Owner-curation flags on the runtime rows (the RecentWork table has them).
  pinned?: boolean;
  hidden?: boolean;
};

/**
 * Work (profile spec D3): what they do in their own words, their skills once,
 * recent work as a timeline, and their links. Their role and organisation sit
 * in the header's facts line, so they aren't repeated here.
 */
export async function WorkSection({
  workBio,
  workTypes,
  expertiseAreas,
  recentWork,
  links,
  isOwner,
  addHref,
}: {
  workBio?: string | null;
  workTypes: string[];
  expertiseAreas: string[];
  recentWork: RecentWork[];
  links: ProfileLink[];
  isOwner: boolean;
  addHref: string | null;
}) {
  const t = await getTranslations("profile");
  const tTypes = await getTranslations("profile.work.types");
  const tExpertise = await getTranslations("profile.work.expertise");
  const label = (map: Record<string, string>, tr: (k: string) => string, v: string) => (map[v] ? tr(map[v]) : v.replace(/_/g, " ").toLowerCase());
  const linkLabel = (l: ProfileLink) =>
    l.kind === "website" ? t("sections.website") : l.kind === "linkedin" ? "LinkedIn" : l.kind === "orcid" ? "ORCID" : l.label;

  return (
    <ProfileSection id="work" title={t("sections.work")}>
      {addHref && <OwnerAddLink href={addHref}>{t("add.work")}</OwnerAddLink>}

      {workBio && (
        <div dir="auto" className="prose max-w-none text-pretty font-sans text-base text-foreground/85 dark:prose-invert">
          <Markdown>{workBio}</Markdown>
        </div>
      )}

      {(workTypes.length > 0 || expertiseAreas.length > 0) && (
        <div>
          <SubHeading>{t("skills")}</SubHeading>
          <div className="flex flex-wrap gap-2">
            {workTypes.map((type) => (
              <Badge key={type} variant="secondary">{label(WORK_TYPE_KEY, tTypes, type)}</Badge>
            ))}
            {expertiseAreas.map((area) => (
              <Badge key={area} variant="outline">{label(EXPERTISE_KEY, tExpertise, area)}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* An empty section already carries the one Add link. */}
      {(recentWork.length > 0 || (isOwner && !addHref)) && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <SubHeading>{t("recentWork.title")}</SubHeading>
            {isOwner && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/profile/edit?tab=recentWork">{t("recentWork.addWork")}</Link>
              </Button>
            )}
          </div>
          {recentWork.length > 0 && (
            <ol className="space-y-4">
              {recentWork.map((work) => (
                <li
                  key={work.id}
                  className={cn(
                    "border-s-2 ps-4",
                    work.pinned ? "border-ccm-sea" : "border-muted",
                    // Hidden items only show to the owner — dim them so it's clear.
                    isOwner && work.hidden && "opacity-50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="break-words font-sans text-base font-semibold text-ccm-midnight"><bdi>{work.title}</bdi></h4>
                      <div dir="auto" className="prose max-w-full text-pretty font-sans text-sm text-muted-foreground dark:prose-invert">
                        <Markdown>{work.description}</Markdown>
                      </div>
                      {work.link && /^https?:\/\//i.test(work.link) && (
                        <a href={work.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ccm-sea hover:underline">
                          {t("recentWork.viewProject")}
                          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isOwner && <RecentWorkOwnerControls id={work.id} hidden={Boolean(work.hidden)} pinned={Boolean(work.pinned)} />}
                      <span className="text-xs text-muted-foreground">
                        {work.isOngoing ? t("recentWork.ongoing") : new Date(work.endDate || work.startDate).getFullYear()}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {links.length > 0 && (
        <div>
          <SubHeading>{t("sections.links")}</SubHeading>
          <ul className="flex flex-wrap gap-2">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ccm-midnight/15 px-4 text-sm font-semibold text-ccm-midnight hover:bg-ccm-sky/15"
                >
                  <bdi>{linkLabel(l)}</bdi>
                  <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ProfileSection>
  );
}
