export type ProfileVisibilityValue = "PUBLIC" | "MEMBERS" | "PRIVATE";

export type VisibilityNoticeKey = "public" | "publicHidden" | "members" | "membersHidden" | "private";

/** Which sentence the profile's owner-only visibility notice shows. Pure. */
export function visibilityNoticeKey(
  visibility: ProfileVisibilityValue | null | undefined,
  searchable: boolean | null | undefined,
): VisibilityNoticeKey {
  if (visibility === "PRIVATE") return "private";
  if (visibility === "MEMBERS") return searchable === false ? "membersHidden" : "members";
  return searchable === false ? "publicHidden" : "public";
}
