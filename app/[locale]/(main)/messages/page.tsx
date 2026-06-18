import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Inbox } from "@/components/messaging/inbox";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <div className="container max-w-5xl py-6">
      <Inbox currentUserId={userId} />
    </div>
  );
}
