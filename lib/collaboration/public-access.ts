import type { CollaborationRole, CollaborationStatus, CollaborationVisibility } from "@/generated/prisma";

export type PublicProject = {
  id: string;
  title: string;
  description: string | null;
  status: CollaborationStatus;
  visibility: CollaborationVisibility;
  lead: { id: string; name: string; username: string | null; image: string | null };
  members: { name: string; username: string | null; image: string | null; role: string }[];
  outputs: { id: string; sanityType: string; title: string; slug: string | null }[];
  counts: { members: number; outputs: number };
};

/**
 * Viewers who are neither a member nor global staff see the PUBLIC project
 * page instead of the workspace editing shell. Members and staff get the shell.
 */
export function canShowPublicProject(input: {
  membershipRole: CollaborationRole | null;
  isStaff: boolean;
}): boolean {
  return input.membershipRole === null && !input.isStaff;
}

/** Only a signed-in non-member may request to join a workspace. */
export function canRequestToJoin(input: { isSignedIn: boolean; isMember: boolean }): boolean {
  return input.isSignedIn && !input.isMember;
}
