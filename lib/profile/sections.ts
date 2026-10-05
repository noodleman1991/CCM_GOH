/**
 * Which sections a profile shows (profile spec D3): a person's story first
 * (About), then Work, what they've done On the hub, and Communities. Visitors
 * see only what has content; the owner sees every section, with an "Add…"
 * link where one is empty. A role and organisation live in the header's facts
 * line, so they alone don't make a Work section. Pure.
 */
export type SectionId = "about" | "work" | "onTheHub" | "communities";
export type Section = { id: SectionId; hasContent: boolean; addHref: string | null };

const filled = (v: string | null | undefined) => typeof v === "string" && v.trim().length > 0;
const ADD: Record<SectionId, string> = {
  about: "/dashboard/profile/edit#about-you",
  work: "/dashboard/profile/edit#work",
  onTheHub: "/dashboard/submissions",
  communities: "/communities",
};

export function profileSections(
  p: {
    bio?: string | null;
    motivation?: string | null;
    lookingFor: string[];
    focusTopics: string[];
    collaborationInterests?: string | null;
    promptCount: number;
    livedExperienceStatement?: string | null;
    workBio?: string | null;
    skillsCount: number;
    recentWorkCount: number;
    linkCount: number;
    contributionCount: number;
    organisedEventCount: number;
    workspaceCount: number;
    communityCount: number;
  },
  viewer: { isOwner: boolean },
): Section[] {
  const content: Record<SectionId, boolean> = {
    about:
      filled(p.bio) || filled(p.motivation) || p.lookingFor.length > 0 || p.focusTopics.length > 0 || filled(p.collaborationInterests) || p.promptCount > 0 || filled(p.livedExperienceStatement),
    work: filled(p.workBio) || p.skillsCount > 0 || p.recentWorkCount > 0 || p.linkCount > 0,
    onTheHub: p.contributionCount > 0 || p.organisedEventCount > 0 || p.workspaceCount > 0,
    communities: p.communityCount > 0,
  };
  return (["about", "work", "onTheHub", "communities"] as const)
    .filter((id) => viewer.isOwner || content[id])
    .map((id) => ({ id, hasContent: content[id], addHref: viewer.isOwner && !content[id] ? ADD[id] : null }));
}

export type ProfileLink = { kind: "website" | "linkedin" | "orcid" | "other"; label: string | null; href: string };
const web = (v: string | null | undefined): v is string => typeof v === "string" && /^https?:\/\//i.test(v.trim());

/**
 * The links a profile shows, already redacted upstream when the member hides
 * their links: a bare LinkedIn handle and an ORCID iD become addresses, and
 * anything that isn't a web address is dropped.
 */
export function profileLinks(p: {
  personalWebsite?: string | null;
  linkedinProfile?: string | null;
  orcidId?: string | null;
  otherSocialLinks: { platform: string; url: string }[];
}): ProfileLink[] {
  const links: ProfileLink[] = [];
  if (web(p.personalWebsite)) links.push({ kind: "website", label: null, href: p.personalWebsite.trim() });
  const linkedin = p.linkedinProfile?.trim();
  if (linkedin) {
    const href = web(linkedin) ? linkedin : /^[\w-]+$/.test(linkedin) ? `https://linkedin.com/in/${linkedin}` : null;
    if (href) links.push({ kind: "linkedin", label: null, href });
  }
  const orcid = p.orcidId?.trim();
  if (orcid && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(orcid)) links.push({ kind: "orcid", label: null, href: `https://orcid.org/${orcid}` });
  for (const l of p.otherSocialLinks) if (web(l.url)) links.push({ kind: "other", label: l.platform, href: l.url.trim() });
  return links;
}
