import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations, getLocale } from "next-intl/server";
import { Inbox } from "@/components/messaging/inbox";
import { getCollaborationAccessFor } from "@/lib/collaboration/access-server";
import { getActor } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "navigation" });
  return { title: t("messages") };
}

export default async function MessagesPage() {
  const locale = await getLocale();
  const access = await getCollaborationAccessFor(await getActor());
  // Messages and notifications open separately in Settings → Collaboration.
  if (!access.messages && !access.notifications) redirect({ href: "/", locale });
  const { userId } = await auth();
  if (!userId) redirect({ href: "/sign-in", locale });
  return (
    <div className="container max-w-5xl py-6">
      <Inbox currentUserId={userId} show={{ messages: access.messages, notifications: access.notifications }} />
    </div>
  );
}
