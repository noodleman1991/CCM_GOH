/** The server's checks before an event suggestion is saved (events spec §3.3). Pure. */
export const MAX_PENDING_SUGGESTIONS = 5;
export type SuggestionRefusal = "signIn" | "paused" | "blocked" | "tooMany";

export function suggestionRefusal(input: {
  userId: string | null;
  open: boolean;
  blocked: string[];
  pendingCount: number;
  isEdit: boolean;
}): SuggestionRefusal | null {
  if (!input.userId) return "signIn";
  if (!input.open) return "paused";
  if (input.blocked.includes(input.userId)) return "blocked";
  // Only brand-new suggestions add to the queue; "needs changes" isn't pending.
  if (!input.isEdit && input.pendingCount >= MAX_PENDING_SUGGESTIONS) return "tooMany";
  return null;
}
