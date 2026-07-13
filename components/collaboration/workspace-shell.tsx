"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { InviteMembers } from "@/components/collaboration/invite-members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, MessagesSquare, FileText, Film, Users, ListTodo, BookText, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { setMemberRole, removeMember } from "@/lib/actions/collaboration";
import type { CollaborationRole } from "@/generated/prisma";
import { WorkspaceThreads } from "./workspace-threads";
import { WorkspaceFiles } from "./workspace-files";
import { WorkspaceMedia } from "./workspace-media";
import { WorkspacePlan } from "./workspace-plan";
import { WorkspaceDocs } from "./workspace-docs";
import WorkspaceOutputs from "./workspace-outputs";
import WorkspaceHome from "./workspace-home";
import { InlineText } from "@/components/ui/inline-text";
import { updateCollaboration } from "@/lib/actions/collaboration";
import { CollaborationPdfDialog } from "./collaboration-pdf-dialog";

type Member = {
  userId: string;
  role: CollaborationRole;
  name: string;
  image: string | null;
  username: string | null;
};

type CollabProps = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "MEMBERS";
  status: string;
  counts: { threads: number; files: number; media: number; members: number; outputs: number };
  members: Member[];
};

type PlanStageProp = {
  id: string;
  title: string;
  tasks: { id: string; title: string; description: string | null; status: "TODO" | "IN_PROGRESS" | "DONE"; assigneeId: string | null }[];
};

type DocProp = { id: string; title: string; content: unknown; updatedAt: string };

type OutputProp = { id: string; sanityId: string; sanityType: string; title: string; status: string; slug: string | null };
type ActivityProp = { kind: string; summary: string; at: string };
type AttentionProp = { kind: "task" | "output" | "notification"; id: string; title: string; detail: string | null; tab: string };

type Section = "overview" | "plan" | "outputs" | "docs" | "threads" | "files" | "media" | "members";

export function WorkspaceShell({
  collaboration,
  myRole,
  isStaff,
  isSignedIn,
  r2Configured,
  planStages,
  docs,
  outputs,
  activity,
}: {
  collaboration: CollabProps;
  myRole: CollaborationRole | null;
  isStaff: boolean;
  isSignedIn: boolean;
  r2Configured: boolean;
  planStages: PlanStageProp[];
  docs: DocProp[];
  outputs: OutputProp[];
  activity: ActivityProp[];
  attention?: AttentionProp[];
}) {
  const t = useTranslations("collaboration");
  const [section, setSection] = useState<Section>("overview");
  const [pdf, setPdf] = useState<{ fileId: string; fileName: string; url: string } | null>(null);
  // Editors+ (and the plan reuses collab:editPlan = EDITOR+).
  const canEdit = myRole === "OWNER" || myRole === "EDITOR";
  const canEditPlan = canEdit;

  // Optimistic local copies so inline edits show immediately.
  const [title, setTitle] = useState(collaboration.title);
  const [description, setDescription] = useState(collaboration.description ?? "");

  const saveTitle = async (next: string) => {
    const prev = title;
    setTitle(next);
    const res = await updateCollaboration(collaboration.id, { title: next });
    if (!res.ok) { setTitle(prev); toast.error(res.error); }
  };
  const saveDescription = async (next: string) => {
    const prev = description;
    setDescription(next);
    const res = await updateCollaboration(collaboration.id, { description: next });
    if (!res.ok) { setDescription(prev); toast.error(res.error); }
  };

  const nav: { id: Section; label: string; icon: typeof LayoutGrid; count?: number }[] = [
    { id: "overview", label: t("nav.overview"), icon: LayoutGrid },
    { id: "outputs", label: t("nav.outputs"), icon: Package, count: collaboration.counts.outputs },
    { id: "plan", label: t("nav.plan"), icon: ListTodo },
    { id: "docs", label: t("nav.docs"), icon: BookText },
    { id: "threads", label: t("nav.threads"), icon: MessagesSquare, count: collaboration.counts.threads },
    { id: "files", label: t("nav.files"), icon: FileText, count: collaboration.counts.files },
    { id: "media", label: t("nav.media"), icon: Film, count: collaboration.counts.media },
    { id: "members", label: t("nav.members"), icon: Users, count: collaboration.counts.members },
  ];

  return (
    <div className="container max-w-6xl py-6">
      {/* Header band: breadcrumb → editable title + status badge. */}
      <header className="mb-4">
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/collaborations">{t("breadcrumbHome")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="rtl:-scale-x-100" />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <bdi>{title || t("untitledWorkspace")}</bdi>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
          <InlineText
            value={title}
            onCommit={saveTitle}
            canEdit={canEdit}
            as="h1"
            placeholder={t("untitledWorkspace")}
            className="flex-1 text-2xl font-heading font-bold text-ccm-midnight"
            inputClassName="text-2xl font-heading font-bold text-ccm-midnight"
          />
          <Badge variant={collaboration.visibility === "PUBLIC" ? "secondary" : "outline"} className="ms-2 shrink-0">
            {t(collaboration.visibility === "PUBLIC" ? "public" : "members")}
          </Badge>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/collaborations/${collaboration.id}?view=public`}>
              {t("viewPublicPage")}
            </Link>
          </Button>
        </div>
      </header>

      {/* Top tabs: a single horizontally-scrollable row (mobile + desktop). */}
      <div className="mb-6 border-b">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label={t("nav.sections")}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "border-ccm-water font-medium text-ccm-sea"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                {item.count !== undefined && <span className="text-xs">{item.count}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-w-0">
          {section === "overview" && (
            <section className="space-y-4">
              {(canEdit || description) && (
                <InlineText
                  value={description}
                  onCommit={saveDescription}
                  canEdit={canEdit}
                  as="p"
                  multiline
                  placeholder={t("addDescription")}
                  className="block text-foreground/90"
                />
              )}
              <WorkspaceHome
                outputs={outputs}
                planStages={planStages}
                activity={activity}
                memberCount={collaboration.counts.members}
                onGoToTab={(tab) => setSection(tab as Section)}
              />
            </section>
          )}

          {section === "outputs" && (
            <WorkspaceOutputs outputs={outputs} collaborationId={collaboration.id} canEdit={canEdit} />
          )}

          {section === "plan" && (
            <WorkspacePlan
              collaborationId={collaboration.id}
              initialStages={planStages}
              canEdit={canEditPlan}
              members={collaboration.members.map((m) => ({ userId: m.userId, name: m.name }))}
            />
          )}

          {section === "docs" && (
            <WorkspaceDocs collaborationId={collaboration.id} initialDocs={docs} canEdit={canEdit} />
          )}

          {section === "threads" && (
            <WorkspaceThreads collaborationId={collaboration.id} myRole={myRole} isSignedIn={isSignedIn} />
          )}

          {section === "files" &&
            (r2Configured ? (
              <WorkspaceFiles
                collaborationId={collaboration.id}
                myRole={myRole}
                onOpenPdf={(f) => f.url && setPdf({ fileId: f.id, fileName: f.fileName, url: f.url })}
              />
            ) : (
              <section className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">{t("storageNotConfigured")}</p>
              </section>
            ))}

          {section === "media" && (
            <WorkspaceMedia collaborationId={collaboration.id} myRole={myRole} isSignedIn={isSignedIn} />
          )}

          {section === "members" && (
            <MembersSection
              collaborationId={collaboration.id}
              members={collaboration.members}
              canManage={myRole === "OWNER"}
            />
          )}
      </div>

      {pdf && (
        <CollaborationPdfDialog
          open={!!pdf}
          onOpenChange={(o) => !o && setPdf(null)}
          fileId={pdf.fileId}
          fileName={pdf.fileName}
          url={pdf.url}
          canAnnotate={myRole === "COMMENTER" || myRole === "EDITOR" || myRole === "OWNER"}
          isSignedIn={isSignedIn}
        />
      )}
    </div>
  );
}

function MembersSection({
  collaborationId,
  members,
  canManage,
}: {
  collaborationId: string;
  members: Member[];
  canManage: boolean;
}) {
  const t = useTranslations("collaboration");
  const roles: CollaborationRole[] = ["OWNER", "EDITOR", "COMMENTER", "VIEWER"];

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());

  const change = async (userId: string, role: CollaborationRole) => {
    const res = await setMemberRole(collaborationId, userId, role);
    if (!res.ok) toast.error(res.error);
    else toast.success(t("roleUpdated"));
  };

  // Two-click removal (no blocking confirm dialog): first click arms, second
  // executes; clicking anything else disarms.
  const onRemove = async (userId: string) => {
    if (confirmRemove !== userId) {
      setConfirmRemove(userId);
      return;
    }
    setConfirmRemove(null);
    const res = await removeMember(collaborationId, userId);
    if (!res.ok) toast.error(res.error);
    else {
      setGone((g) => new Set(g).add(userId));
      toast.success(t("memberRemoved"));
    }
  };

  return (
    <section className="space-y-3">
      {canManage && (
        <InviteMembers collaborationId={collaborationId} existingIds={members.map((m) => m.userId)} />
      )}
      {members.filter((m) => !gone.has(m.userId)).map((m) => (
        <div key={m.userId} className="flex items-center gap-3 rounded-lg border p-3">
          <Avatar className="size-9">
            {m.image && <AvatarImage src={m.image} alt="" />}
            <AvatarFallback>{m.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              <bdi>{m.name}</bdi>
            </p>
            {m.username && <p className="truncate text-xs text-muted-foreground">@{m.username}</p>}
          </div>
          {canManage ? (
            <Select defaultValue={m.role} onValueChange={(v) => change(m.userId, v as CollaborationRole)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`role.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline">{t(`role.${m.role}`)}</Badge>
          )}
          {canManage && (
            <Button
              variant={confirmRemove === m.userId ? "destructive" : "ghost"}
              size="sm"
              className="min-h-8 shrink-0"
              onClick={() => onRemove(m.userId)}
              onBlur={() => setConfirmRemove((c) => (c === m.userId ? null : c))}
            >
              {confirmRemove === m.userId ? t("removeConfirm") : t("removeMember")}
            </Button>
          )}
        </div>
      ))}
    </section>
  );
}
