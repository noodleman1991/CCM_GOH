/** The roles an admin can give a member in Settings → Members & roles. */
export const MEMBER_ROLES = ["community_member", "team_editor", "admin"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];
