import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { getCollaboration, getMembershipRole, authorizeCollab, getPlan, getDocs } from "@/lib/collaboration/service";
import { getActor, isStaff } from "@/lib/authz";
import { r2Configured } from "@/lib/r2";
import { WorkspaceShell } from "@/components/collaboration/workspace-shell";

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
}: {
  params: Promise<{ id: string }>;
}) {
  if (!FEATURES.engagement) redirect("/");
  const { id } = await params;

  // Authorize read (PUBLIC = anyone, MEMBERS = members or staff).
  try {
    await authorizeCollab(id, "collab:read");
  } catch {
    redirect("/collaborations");
  }

  const collab = await getCollaboration(id);
  if (!collab) notFound();

  const { userId } = await auth();
  const actor = await getActor();
  const myRole = userId ? await getMembershipRole(id, userId) : null;

  const plan = await getPlan(id);
  const planStages =
    plan?.stages.map((s) => ({
      id: s.id,
      title: s.title,
      tasks: s.tasks.map((t) => ({ id: t.id, title: t.title, status: t.status })),
    })) ?? [];

  const docsRows = await getDocs(id);
  const docs = docsRows.map((d) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    updatedAt: d.updatedAt.toISOString(),
  }));

  return (
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
    />
  );
}
