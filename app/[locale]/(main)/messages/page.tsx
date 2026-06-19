import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { Inbox } from "@/components/messaging/inbox";
import { FEATURES } from "@/lib/features";

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
  if (!FEATURES.engagement) redirect("/");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <div className="container max-w-5xl py-6">
      <Inbox currentUserId={userId} />
    </div>
  );
}
