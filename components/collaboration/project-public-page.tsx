// components/collaboration/project-public-page.tsx
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { projectColor } from "@/lib/ccm-colors";
import { OUTPUT_TYPES } from "@/lib/collaboration/outputs";
import type { PublicProject } from "@/lib/collaboration/public";
import { ProjectCtaBar } from "./project-cta-bar";

// Maps the real CollaborationStatus enum (DRAFT | ACTIVE | ARCHIVED) to a
// label + a projectColor key. ARCHIVED reads as "Completed" on the public page.
function statusMeta(status: PublicProject["status"], t: (k: string) => string): {
  label: string;
  colorKey: "Active" | "Recruiting" | "Completed";
} {
  switch (status) {
    case "DRAFT":
      return { label: t("statusDraft"), colorKey: "Recruiting" };
    case "ARCHIVED":
      return { label: t("statusArchived"), colorKey: "Completed" };
    default:
      return { label: t("statusActive"), colorKey: "Active" };
  }
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "M";
}

export async function ProjectPublicPage({
  project,
  isSignedIn,
  isMember,
}: {
  project: PublicProject;
  isSignedIn: boolean;
  isMember: boolean;
}) {
  const t = await getTranslations("projectPublic");
  const gated = project.visibility === "MEMBERS"; // non-member viewing a private workspace
  const status = statusMeta(project.status, t);

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Hero */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-0 text-white" style={{ backgroundColor: projectColor(status.colorKey) }}>
            {status.label}
          </Badge>
        </div>
        <h1 className="text-3xl font-heading font-bold text-ccm-midnight">
          <bdi>{project.title}</bdi>
        </h1>
        <p className="text-sm text-muted-foreground">
          <bdi>{project.lead.name}</bdi>
        </p>
        <ProjectCtaBar
          projectId={project.id}
          projectTitle={project.title}
          leadUserId={project.lead.id}
          isSignedIn={isSignedIn}
          isMember={isMember}
        />
        {isMember && (
          <div className="mt-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/collaborations/${project.id}`}>{t("openWorkspace")}</Link>
            </Button>
          </div>
        )}
      </header>

      {gated ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("privateNotice")}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* About */}
          {project.description && (
            <section className="space-y-2">
              <h2 className="font-heading text-xl font-semibold text-ccm-midnight">{t("aboutHeading")}</h2>
              <p className="whitespace-pre-line text-foreground/90">
                <bdi>{project.description}</bdi>
              </p>
            </section>
          )}

          {/* Team */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-ccm-midnight">{t("teamHeading")}</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {project.members.map((m) => (
                <li key={(m.username ?? m.name) + m.role} className="flex items-center gap-2">
                  <Avatar className="size-9">
                    {m.image && <AvatarImage src={m.image} alt="" />}
                    <AvatarFallback className="bg-ccm-sky/30 text-ccm-sea text-xs">
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">
                    <bdi>{m.name}</bdi>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Published outputs */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-ccm-midnight">{t("outputsHeading")}</h2>
            {project.outputs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("outputsEmpty")}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {project.outputs.map((o) => {
                  const def = OUTPUT_TYPES.find((d) => d.type === o.sanityType);
                  const href = def ? def.route : "#"; // slug not stored yet → link to the type index
                  return (
                    <li key={o.id}>
                      <Link href={href} className="group block">
                        <Card className="h-full transition-shadow hover:shadow-md">
                          <CardContent className="space-y-1 p-4">
                            {def && <Badge variant="outline">{def.label}</Badge>}
                            <p className="font-medium text-ccm-midnight group-hover:text-ccm-sea">
                              <bdi>{o.title}</bdi>
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
