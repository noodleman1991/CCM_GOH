import "server-only";

import type { CollaborationRole } from "@/generated/prisma";

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
