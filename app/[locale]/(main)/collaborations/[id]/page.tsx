import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCollaboration, getMembershipRole, authorizeCollab } from "@/lib/collaboration/service";
import { getActor, isStaff } from "@/lib/authz";
import { r2Configured } from "@/lib/r2";
import { WorkspaceShell } from "@/components/collaboration/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CollaborationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    />
  );
}
