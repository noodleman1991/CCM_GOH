/** The editors' list of people who can't suggest events (the `eventSuggestions` global). Pure. */
export type BlockedEntry = { userId: string; note?: string };

export function withBlocked(list: BlockedEntry[], userId: string, note?: string): BlockedEntry[] {
  if (list.some((b) => b.userId === userId)) return list;
  return [...list, note ? { userId, note } : { userId }];
}

export function withoutBlocked(list: BlockedEntry[], userId: string): BlockedEntry[] {
  return list.some((b) => b.userId === userId) ? list.filter((b) => b.userId !== userId) : list;
}
