"use client";
import { useDocumentInfo } from "@payloadcms/ui";
import { publishStateMessage } from "./publish-state-message";

/** One line at the top of a drafts-enabled document: what visitors see right now. */
export function PublishState() {
  const { hasPublishedDoc, unpublishedVersionCount } = useDocumentInfo();
  const live = Boolean(hasPublishedDoc) && !unpublishedVersionCount;
  return (
    <p
      role="status"
      style={{
        margin: "0 0 1rem",
        padding: "0.6rem 0.9rem",
        borderRadius: "0.5rem",
        background: live ? "var(--theme-success-100)" : "var(--theme-warning-100)",
        color: live ? "var(--theme-success-800)" : "var(--theme-warning-800)",
        fontWeight: 600,
      }}
    >
      {publishStateMessage({ hasPublishedDoc: Boolean(hasPublishedDoc), unpublishedVersionCount: unpublishedVersionCount ?? 0 })}
    </p>
  );
}
