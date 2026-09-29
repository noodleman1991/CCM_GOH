/** What visitors see right now, in words (editor-experience spec §3.3). Pure. */
export function publishStateMessage({ hasPublishedDoc, unpublishedVersionCount }: { hasPublishedDoc: boolean; unpublishedVersionCount: number }): string {
  if (!hasPublishedDoc) return "Not published yet — visitors can't see this.";
  if (unpublishedVersionCount > 0) return "Visitors still see the published version. You have unpublished changes.";
  return "Everything you see is live.";
}
