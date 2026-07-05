import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { getCollaboration, getMembershipRole, getPlan, getDocs, getOutputs, refreshOutputStatuses, getActivity } from "@/lib/collaboration/service";
import { getActor, isStaff } from "@/lib/authz";
import { r2Configured } from "@/lib/r2";
import { WorkspaceShell } from "@/components/collaboration/workspace-shell";
import { getWorkspaceAttention } from "@/lib/collaboration/attention";
import { WorkspaceSidebarCollapse } from "@/components/collaboration/workspace-sidebar-collapse";
import { canShowPublicProject } from "@/lib/collaboration/public-access";
import { getPublicProject } from "@/lib/collaboration/public";
import { ProjectPublicPage } from "@/components/collaboration/project-public-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const collab = await getCollaboration(id);
  if (collab?.title) return { title: collab.title };
  // Fall back to the generic workspaces label when missing/unauthorized.
  const t = await getTranslations({ locale, namespace: "collaboration" });
  return { title: t("pageTitle") };
}

export default async function CollaborationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!FEATURES.engagement) redirect("/");
  const { id } = await params;
  const sp = await searchParams;
  const forcePublic = sp?.view === "public";

  // We intentionally do NOT redirect non-members of a private workspace here:
  // they receive the gated public page (title + "This is a private workspace" +
  // Request to join) rendered by ProjectPublicPage below. The public projection
  // exposes only public-safe fields, so this does not leak private content.
  // (Members/staff still fall through to the full workspace shell.)

  const collab = await getCollaboration(id);
  if (!collab) notFound();

  const { userId } = await auth();
  const actor = await getActor();
  const myRole = userId ? await getMembershipRole(id, userId) : null;

  // Non-members (and non-staff) get the PUBLIC project page, not the workspace shell.
  // Members/staff can also preview the public page via ?view=public.
  if (forcePublic || canShowPublicProject({ membershipRole: myRole, isStaff: isStaff(actor) })) {
    const publicProject = await getPublicProject(id);
    if (!publicProject) notFound();
    const viewerIsMember = myRole !== null;
    return (
      <ProjectPublicPage project={publicProject} isSignedIn={!!userId} isMember={viewerIsMember} />
    );
  }

  const plan = await getPlan(id);
  const planStages =
    plan?.stages.map((s) => ({
      id: s.id,
      title: s.title,
      tasks: s.tasks.map((t) => ({ id: t.id, title: t.title, description: t.description, status: t.status, assigneeId: t.assignee?.id ?? null })),
    })) ?? [];

  const docsRows = await getDocs(id);
  const docs = docsRows.map((d) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    updatedAt: d.updatedAt.toISOString(),
  }));

  // Refresh cached output statuses from Sanity, then load outputs + activity.
  await refreshOutputStatuses(id);
  const [outputs, activity, attention] = await Promise.all([
    getOutputs(id),
    getActivity(id),
    getWorkspaceAttention(id, actor?.id ?? null),
  ]);

  return (
    <>
      <WorkspaceSidebarCollapse />
      <WorkspaceShell
      collaboration={{
        id: collab.id,
        title: collab.title,
        description: collab.description,
        visibility: collab.visibility,
        status: collab.status,
        counts: collab._count,
        members: collab.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          name:
            [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.username || "Member",
          image: m.user.image,
          username: m.user.username,
        })),
      }}
      myRole={myRole}
      isStaff={isStaff(actor)}
      isSignedIn={!!userId}
      r2Configured={r2Configured()}
      planStages={planStages}
      docs={docs}
      outputs={outputs}
      activity={activity}
      attention={attention}
      />
    </>
  );
}
