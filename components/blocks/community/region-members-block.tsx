import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import SectionContainer from "@/components/ui/section-container";
import { Badge } from "@/components/ui/badge";
import { heading } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { getRegionMembers } from "@/lib/community/region-data";
import { initials } from "@/lib/community/contributions";

/**
 * Shows the people who are members of a regional community — the "see the
 * region's people" layer of the community graph. Server component; fetches via
 * G1 (privacy-filtered) and renders nothing if there are no public members.
 */
export async function RegionMembersBlock({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const members = await getRegionMembers(slug);
  if (members.length === 0) return null;

  const t = await getTranslations("regional");

  return (
    <SectionContainer>
      <div className="mx-auto max-w-6xl px-4 @content-sm/page:px-6 @content-lg/page:px-8">
        <div className="mb-6 @content-md/page:mb-8 text-center">
          <h2 className={cn("font-bold font-heading text-ccm-midnight text-balance", heading("md"))}>
            {t("communityMembers")}
          </h2>
        </div>
        <ul className="grid grid-cols-2 gap-6 @content-sm/page:grid-cols-3 @content-xl/page:grid-cols-4">
          {members.slice(0, 12).map((m) => (
            <li key={m.id}>
              <Link
                href={`/profiles/${m.username}`}
                className="group flex flex-col items-center text-center"
              >
                <span className="relative mb-3 size-20 overflow-hidden rounded-full bg-muted ring-2 ring-background shadow-sm transition group-hover:ring-[var(--color-ccm-sea)]">
                  {m.image ? (
                    // External user avatars (Clerk / Gravatar) — unoptimized so
                    // we don't depend on the host allowlist and they always load.
                    <Image src={m.image} alt={m.displayName} fill unoptimized className="object-cover" sizes="80px" />
                  ) : (
                    <span className="flex size-full items-center justify-center bg-[var(--color-ccm-sky)]/30 text-lg font-bold text-[var(--color-ccm-sea)]" aria-hidden="true">
                      {initials(m.displayName)}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 text-sm font-semibold text-ccm-midnight">
                  {m.displayName}
                </span>
                {m.contributionCount > 0 && (
                  <Badge variant="secondary" className="mt-1 text-[11px] font-normal">
                    {t("contributionCount", { count: m.contributionCount })}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SectionContainer>
  );
}
