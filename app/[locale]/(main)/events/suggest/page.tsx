import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { SuggestForm } from "@/components/events/suggest-form";
import { YourSuggestions } from "@/components/events/your-suggestions";
import { loadEditableEvent } from "@/lib/events/edit";
import { countPendingEventSuggestions, getEventSuggestionSettings } from "@/lib/content/discovery";
import { listMyContributions } from "@/lib/content/contributions";
import { getRegionalCommunities } from "@/lib/content/news";
import { MAX_PENDING_SUGGESTIONS, suggestionRefusal } from "@/lib/events/suggestion-guard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events.suggest" });
  return { title: t("title"), description: t("intro") };
}

/** A calm panel for every "not right now" answer. */
function Notice({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-ccm-midnight/10 bg-ccm-sky/10 p-6">
      <h2 className="font-heading text-lg font-bold text-ccm-midnight">{title}</h2>
      <p className="text-ccm-midnight/80">{body}</p>
      {children}
    </div>
  );
}

/**
 * Suggest an event (events spec §3.2). Open to any signed-in member, behind the
 * editors' switch, their block list and the cap of waiting suggestions — the
 * page says which applies; the submit endpoint enforces the same rules.
 */
export default async function SuggestEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string; edit?: string }>;
}) {
  const { locale } = await params;
  const { workspace, edit } = await searchParams;
  const [{ userId }, t] = await Promise.all([auth(), getTranslations({ locale, namespace: "events.suggest" })]);

  const header = (
    <header className="space-y-3">
      <BackLink href="/events" label={t("back")} />
      <h1 className="font-heading text-3xl font-bold tracking-tight text-ccm-midnight">{t("title")}</h1>
      <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
    </header>
  );

  if (!userId) {
    return (
      <div className="container max-w-2xl space-y-6 py-8">
        {header}
        <Notice title={t("signInTitle")} body={t("signInBody")}>
          <Button asChild>
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(`/${locale}/events/suggest`)}`}>{t("signIn")}</Link>
          </Button>
        </Notice>
      </div>
    );
  }

  const [settings, pending, mine, communities, editDoc] = await Promise.all([
    getEventSuggestionSettings(),
    countPendingEventSuggestions(userId),
    listMyContributions(userId, locale).then((all) => all.filter((c) => c.kind === "event")),
    getRegionalCommunities().catch(() => []),
    edit ? loadEditableEvent(edit, userId) : Promise.resolve(null),
  ]);
  const refusal = suggestionRefusal({ userId, open: settings.open, blocked: settings.blocked, pendingCount: pending, isEdit: Boolean(editDoc) });
  const communityOptions = communities
    .map((c) => ({ id: c._id, name: (c.name as Record<string, string | undefined>)?.[locale] || (c.name as Record<string, string | undefined>)?.en || c.slug }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  return (
    <div className="container max-w-2xl space-y-8 py-8">
      {header}
      {refusal === "paused" ? (
        <Notice title={t("pausedTitle")} body={t("pausedBody")} />
      ) : refusal === "blocked" ? (
        <Notice title={t("blockedTitle")} body={t("blockedBody")} />
      ) : refusal === "tooMany" ? (
        <Notice title={t("tooManyTitle")} body={t("tooManyBody", { max: MAX_PENDING_SUGGESTIONS })} />
      ) : (
        <SuggestForm communities={communityOptions} editDoc={editDoc} workspaceId={workspace ?? null} />
      )}
      <YourSuggestions items={mine} />
    </div>
  );
}
