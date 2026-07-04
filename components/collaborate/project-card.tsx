import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import type { PublicProjectCard } from "@/lib/collaboration/public-list";

/** One project in the Collaborate → Projects grid (§4.6). Members get a
 *  workspace CTA; everyone else views the public project page (the
 *  /collaborations/[id] route branches by membership). */
export async function ProjectCard({ project }: { project: PublicProjectCard }) {
  const t = await getTranslations("collabSpace");
  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-lg font-semibold text-ccm-midnight">
          <bdi>{project.title}</bdi>
        </h3>
        <span className="shrink-0 rounded-full bg-ccm-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ccm-sea">
          {t("publicChip")}
        </span>
      </div>
      {project.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          <bdi>{project.description}</bdi>
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" aria-hidden />
          {project.leadName ? <bdi>{project.leadName}</bdi> : null}
          {project.leadName ? " · " : null}
          {t("memberCount", { count: project.memberCount })}
        </span>
        <Button asChild size="sm" variant={project.isMember ? "default" : "outline"} className="min-h-[44px]">
          <Link href={`/collaborations/${project.id}`}>
            {project.isMember ? t("openWorkspace") : t("viewProject")}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
