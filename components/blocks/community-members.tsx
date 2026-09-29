import { RegionMembersBlock } from "@/components/blocks/community/region-members-block";

/**
 * The community's members (CMS project 3): the members graph for the page's
 * community, with its own translated heading. Nothing outside a community page.
 */
export default async function CommunityMembers({
  communitySlug,
  locale,
}: {
  communitySlug?: string;
  locale: string;
  title?: string | null;
}) {
  if (!communitySlug) return null;
  return <RegionMembersBlock slug={communitySlug} locale={locale} />;
}
