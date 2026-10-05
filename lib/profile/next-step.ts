/**
 * The one next thing that would make a member's profile better (dashboard
 * spec D2) — a specific step instead of a percentage. Pure.
 */
export type ProfileStep = { key: "photo" | "headline" | "bio" | "aboutYou" | "work" | "community"; href: string } | null;

const filled = (v: string | null | undefined) => typeof v === "string" && v.trim().length > 0;

export function nextProfileStep(user: {
  image?: string | null;
  headline?: string | null;
  bio?: string | null;
  motivation?: string | null;
  lookingFor?: string[];
  organization?: string | null;
  position?: string | null;
  communityCount: number;
}): ProfileStep {
  const edit = (anchor: string) => `/dashboard/profile/edit#${anchor}`;
  if (!filled(user.image)) return { key: "photo", href: edit("photo") };
  if (!filled(user.headline)) return { key: "headline", href: edit("headline") };
  if (!filled(user.bio)) return { key: "bio", href: edit("bio") };
  if (!filled(user.motivation) && (user.lookingFor ?? []).length === 0) return { key: "aboutYou", href: edit("about-you") };
  if (!filled(user.organization) && !filled(user.position)) return { key: "work", href: edit("work") };
  if (user.communityCount === 0) return { key: "community", href: "/communities" };
  return null;
}
