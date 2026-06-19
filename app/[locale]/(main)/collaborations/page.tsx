import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";
import { FEATURES } from "@/lib/features";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessagesSquare, FileText, Plus } from "lucide-react";
import { listVisibleCollaborations } from "@/lib/collaboration/service";
import { CreateCollaborationButton } from "@/components/collaboration/create-collaboration-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collaboration" });
  return { title: t("pageTitle"), description: t("pageDescription") };
}

export default async function CollaborationsPage() {
  if (!FEATURES.engagement) redirect("/");
  const { userId } = await auth();
  const t = await getTranslations("collaboration");
  const collabs = await listVisibleCollaborations(userId ?? null);

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-ccm-midnight">{t("pageTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("pageDescription")}</p>
        </div>
        {userId ? (
          <CreateCollaborationButton />
        ) : (
          <Button asChild>
            <Link href="/sign-in">{t("signInToCreate")}</Link>
          </Button>
        )}
      </div>

      {collabs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Plus className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">{t("empty")}</p>
            {userId && <CreateCollaborationButton />}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {collabs.map((c) => (
            <Link key={c.id} href={`/collaborations/${c.id}`} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-heading font-semibold text-ccm-midnight group-hover:text-ccm-sea">
                      <bdi>{c.title}</bdi>
                    </h2>
                    <Badge variant={c.visibility === "PUBLIC" ? "secondary" : "outline"}>
                      {t(c.visibility === "PUBLIC" ? "public" : "members")}
                    </Badge>
                  </div>
                  {c.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" /> {c._count.members}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessagesSquare className="size-3.5" /> {c._count.threads}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="size-3.5" /> {c._count.files}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
