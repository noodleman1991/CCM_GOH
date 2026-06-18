"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, MessagesSquare, FileText, Film, Users, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { setMemberRole } from "@/lib/actions/collaboration";
import type { CollaborationRole } from "@/generated/prisma";
import { WorkspaceThreads } from "./workspace-threads";

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
  counts: { threads: number; files: number; media: number; members: number };
  members: Member[];
};

type Section = "overview" | "threads" | "files" | "media" | "members";

export function WorkspaceShell({
  collaboration,
  myRole,
  isStaff,
  isSignedIn,
}: {
  collaboration: CollabProps;
  myRole: CollaborationRole | null;
  isStaff: boolean;
  isSignedIn: boolean;
}) {
  const t = useTranslations("collaboration");
  const [section, setSection] = useState<Section>("overview");

  const nav: { id: Section; label: string; icon: typeof LayoutGrid; count?: number }[] = [
    { id: "overview", label: t("nav.overview"), icon: LayoutGrid },
    { id: "threads", label: t("nav.threads"), icon: MessagesSquare, count: collaboration.counts.threads },
    { id: "files", label: t("nav.files"), icon: FileText, count: collaboration.counts.files },
    { id: "media", label: t("nav.media"), icon: Film, count: collaboration.counts.media },
    { id: "members", label: t("nav.members"), icon: Users, count: collaboration.counts.members },
  ];

  const NavList = ({ onPick }: { onPick?: () => void }) => (
    <nav className="space-y-1">
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              setSection(item.id);
              onPick?.();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              section === item.id
                ? "bg-ccm-sky/20 font-medium text-ccm-sea"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 text-start">{item.label}</span>
            {item.count !== undefined && <span className="text-xs">{item.count}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="container max-w-6xl py-6">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          {/* Mobile: drawer nav */}
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label={t("nav.sections")}>
                <Menu className="size-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4">
                <NavList onPick={() => {}} />
              </div>
            </DrawerContent>
          </Drawer>
          <h1 className="text-2xl font-heading font-bold text-ccm-midnight">
            <bdi>{collaboration.title}</bdi>
          </h1>
          <Badge variant={collaboration.visibility === "PUBLIC" ? "secondary" : "outline"} className="ms-2">
            {t(collaboration.visibility === "PUBLIC" ? "public" : "members")}
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Desktop left nav */}
        <aside className="hidden lg:block">
          <NavList />
        </aside>

        <div className="min-w-0">
          {section === "overview" && (
            <section className="space-y-4">
              {collaboration.description && (
                <p className="text-foreground/90">{collaboration.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {nav.slice(1).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSection(n.id)}
                    className="rounded-lg border p-4 text-start transition-colors hover:bg-muted"
                  >
                    <p className="text-2xl font-bold text-ccm-midnight">{n.count}</p>
                    <p className="text-sm text-muted-foreground">{n.label}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {section === "threads" && (
            <WorkspaceThreads collaborationId={collaboration.id} myRole={myRole} isSignedIn={isSignedIn} />
          )}

          {(section === "files" || section === "media") && (
            <section className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">{t("storageNotConfigured")}</p>
            </section>
          )}

          {section === "members" && (
            <MembersSection
              collaborationId={collaboration.id}
              members={collaboration.members}
              canManage={myRole === "OWNER"}
            />
          )}
        </div>
      </div>
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

  const change = async (userId: string, role: CollaborationRole) => {
    const res = await setMemberRole(collaborationId, userId, role);
    if (!res.ok) toast.error(res.error);
    else toast.success(t("roleUpdated"));
  };

  return (
    <section className="space-y-3">
      {members.map((m) => (
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
        </div>
      ))}
    </section>
  );
}
