"use client";

/**
 * The admin replacement for the four Studio document actions.
 *
 * Mounted as a `ui` field on each moderated collection, so it appears inside the
 * document the reviewer is looking at — the same place Studio put its actions,
 * and (unlike a custom admin view) it needs no database column, hence no
 * migration.
 *
 * **The gate is `availableModerationActions`, shared with the server.** Studio
 * hid an action whose `visibleWhenStatus` did not include the document's
 * current status; this hides exactly the same set, from exactly the same table,
 * and the server re-checks it against the persisted document before writing —
 * so a stale form, an edited request or a status changed in another tab cannot
 * drive an illegal transition. A hidden button is a courtesy; the server's
 * check is the rule.
 *
 * Studio collected the reviewer's note with `window.prompt` and its rejection
 * confirmation with `window.confirm`, and abandoned the patch when either was
 * cancelled. Both are reproduced as an inline panel rather than as browser
 * modals: `window.prompt` is blocked outright in some browsers and inside
 * sandboxed frames, and a cancelled prompt is indistinguishable from an empty
 * note.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import {
  availableModerationActions,
  isModeratedCollection,
  MODERATION_WORKFLOWS,
  type ModerationAction,
} from "@/payload/moderation/workflows";
import { runModerationAction } from "./moderation-actions-server";

const TONE: Record<ModerationAction, "primary" | "secondary" | "error"> = {
  approve: "primary",
  revision: "secondary",
  reject: "error",
};

export function ModerationActions() {
  const { id, collectionSlug } = useDocumentInfo();
  const router = useRouter();
  const status = useFormFields(([fields]) => fields?.moderationStatus?.value);
  const suggestedTags = useFormFields(([fields]) => fields?.suggestedTags?.value) as unknown;
  const suggestions = Array.isArray(suggestedTags) ? suggestedTags.filter((s): s is string => typeof s === "string" && s.length > 0) : [];
  const [pending, setPending] = useState<ModerationAction | null>(null);
  const [notesFor, setNotesFor] = useState<ModerationAction | null>(null);
  const [notes, setNotes] = useState("");

  const collection = isModeratedCollection(collectionSlug) ? collectionSlug : undefined;
  const actions = useMemo(
    () => (collection ? availableModerationActions(collection, status) : []),
    [collection, status],
  );

  // A brand-new, unsaved document has no id to act on, and an unset
  // moderationStatus offers nothing — both mirror Studio, where the action was
  // simply absent.
  if (!collection || !id || actions.length === 0) return null;

  const workflow = MODERATION_WORKFLOWS[collection];

  const submit = async (action: ModerationAction, reviewNotes?: string) => {
    setPending(action);
    try {
      const result = await runModerationAction({
        collection,
        id: String(id),
        action,
        reviewNotes,
      });
      if (result.ok) {
        toast.success(result.message);
        setNotesFor(null);
        setNotes("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      // Studio rethrew so the reviewer saw the failure rather than a silent
      // no-op. Same intent, without taking the admin down with it.
      console.error("[moderation] action failed:", error);
      toast.error("Moderation action failed. See the console for details.");
    } finally {
      setPending(null);
    }
  };

  const start = (action: ModerationAction) => {
    if (workflow.actions[action].requiresNotes) {
      setNotesFor(action);
      setNotes("");
      return;
    }
    void submit(action);
  };

  return (
    <div className="field-type moderation-actions" style={{ marginBottom: "1.5rem" }}>
      {suggestions.length > 0 ? (
        <p style={{ margin: "0 0 0.75rem" }}>
          <strong>Suggested tags from the submitter:</strong> {suggestions.join(", ")}.{" "}
          <a href="/admin/collections/tags/create" target="_blank" rel="noreferrer">
            Create a tag
          </a>
          , attach it in the Tags field, then clear the suggestions in the sidebar.
        </p>
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        {actions.map((action) => (
          <Button
            key={action}
            buttonStyle={TONE[action]}
            size="small"
            disabled={pending !== null}
            onClick={() => start(action)}
          >
            {workflow.actions[action].label}
          </Button>
        ))}
      </div>

      {notesFor ? (
        <div style={{ marginTop: "0.75rem", maxWidth: "40rem" }}>
          <label htmlFor="moderation-review-notes" style={{ display: "block", marginBottom: "0.25rem" }}>
            {notesFor === "approve"
              ? "Notes"
              : notesFor === "revision"
                ? "Feedback for the submitter (required)"
                : "Reason (required)"}
          </label>
          <textarea
            id="moderation-review-notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            style={{ width: "100%" }}
          />
          {workflow.actions[notesFor].requiresConfirmation ? (
            <p style={{ margin: "0.5rem 0" }}>
              This cannot be undone from here — the document will be set to{" "}
              <strong>{workflow.actions[notesFor].writes}</strong> and removed from public view.
            </p>
          ) : null}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button
              buttonStyle={TONE[notesFor]}
              size="small"
              disabled={pending !== null || notes.trim().length === 0}
              onClick={() => void submit(notesFor, notes)}
            >
              {workflow.actions[notesFor].requiresConfirmation ? "Confirm" : "Send"}
            </Button>
            <Button
              buttonStyle="secondary"
              size="small"
              disabled={pending !== null}
              onClick={() => {
                setNotesFor(null);
                setNotes("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ModerationActions;
