import { redirect } from "next/navigation";
import { getActor, isStaff } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { BroadcastForm } from "@/components/notifications/broadcast-form";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const actor = await getActor();
  if (!isStaff(actor)) redirect("/");

  const communities = await prisma.community.findMany({
    select: { id: true, name: true, type: true, regionalName: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-2 text-3xl font-heading font-bold text-ccm-midnight">Send a notification</h1>
      <p className="mb-6 text-muted-foreground">
        Notify a single member, a community, a region, or everyone. Recipients get an in-app
        notification (and an email if they haven't opted out).
      </p>
      <BroadcastForm
        communities={communities.map((c) => ({ id: c.id, name: c.name, type: c.type, regionalName: c.regionalName }))}
      />
    </div>
  );
}
