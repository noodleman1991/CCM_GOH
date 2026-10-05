import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ContributionsBlock } from "@/components/blocks/profile/contributions-block";
import type { Contribution } from "@/lib/community/contributions";
import type { EventTileData } from "@/lib/events/listing";
import { OrganisedEvents } from "./organised-events";
import { OwnerAddLink, ProfileSection, SubHeading } from "./owner-add-link";

/**
 * On the hub (profile spec D3): what they've shared, the events they
 * organise and their public workspaces. RSVPs are never shown here.
 */
export async function OnTheHubSection({
  contributions,
  events,
  workspaces,
  locale,
  addHref,
}: {
  contributions: Contribution[];
  events: EventTileData[];
  workspaces: { id: string; title: string }[];
  locale: string;
  addHref: string | null;
}) {
  const t = await getTranslations("profile");
  return (
    <ProfileSection id="on-the-hub" title={t("sections.onTheHub")}>
      {addHref && <OwnerAddLink href={addHref}>{t("add.onTheHub")}</OwnerAddLink>}

      <ContributionsBlock contributions={contributions} locale={locale} />

      {events.length > 0 && (
        <div className="@container">
          <SubHeading>{t("sections.organisedEvents")}</SubHeading>
          <OrganisedEvents events={events} locale={locale} now={new Date().toISOString()} />
        </div>
      )}

      {workspaces.length > 0 && (
        <div>
          <SubHeading>{t("workspaces")}</SubHeading>
          <ul className="flex flex-wrap gap-2">
            {workspaces.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/collaborations/${w.id}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ccm-midnight/15 bg-white px-4 text-sm font-semibold text-ccm-midnight hover:bg-ccm-sky/15"
                >
                  <Users className="size-4 text-ccm-sea" aria-hidden />
                  <bdi>{w.title}</bdi>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ProfileSection>
  );
}
