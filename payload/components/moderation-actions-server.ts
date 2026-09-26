"use server";

/**
 * The server half of the admin moderation buttons — Studio's
 * `client.patch(id).set(patch).commit()`, moved to the server.
 *
 * Studio ran the mutation **in the reviewer's browser** with their own session
 * client, which is why the four action files had to use `useClient` and why the
 * webhook (not the action) was the only place an email could be sent — the
 * Resend key lives on the server. Here the mutation is a server action, so the
 * decision, the write and its side effects all happen in one place, under one
 * authorization check.
 *
 * The gate is the same predicate the collections use (`hasEditorRole`, over the
 * Prisma `User.role` enum mirrored onto the Payload user), and the write itself
 * additionally runs with `overrideAccess: false`, so the collection's own
 * `update: isEditor` decides a second time. Neither the target status nor any
 * field name comes from the browser: the client sends a collection, an id, an
 * action name and (for the two actions that need one) the reviewer's note.
 */
import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { hasEditorRole } from "@/payload/access";
import {
  applyModerationAction,
  isModeratedCollection,
  isModerationAction,
  MODERATION_WORKFLOWS,
  ModerationActionNotAvailableError,
  ModerationNotesRequiredError,
} from "@/payload/moderation/workflows";

export interface ModerationActionRequest {
  collection: string;
  id: string;
  action: string;
  reviewNotes?: string;
}

export type ModerationActionResponse =
  | { ok: true; message: string; status: string }
  | { ok: false; error: string };

export async function runModerationAction(input: ModerationActionRequest): Promise<ModerationActionResponse> {
  if (!isModeratedCollection(input.collection)) {
    return { ok: false, error: "That collection has no moderation workflow." };
  }
  if (!isModerationAction(input.action)) {
    return { ok: false, error: "Unknown moderation action." };
  }
  if (!input.id) {
    return { ok: false, error: "No document id." };
  }

  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!hasEditorRole(user)) {
    return { ok: false, error: "You do not have permission to moderate this document." };
  }

  try {
    const result = await applyModerationAction(payload, {
      collection: input.collection,
      id: input.id,
      action: input.action,
      reviewNotes: input.reviewNotes,
      user,
    });
    const label = MODERATION_WORKFLOWS[result.collection].actions[input.action].label;
    return {
      ok: true,
      status: result.to,
      message: result.published
        ? `${label}: now ${result.to} and published.`
        : `${label}: now ${result.to}.`,
    };
  } catch (error) {
    if (error instanceof ModerationActionNotAvailableError || error instanceof ModerationNotesRequiredError) {
      return { ok: false, error: error.message };
    }
    console.error("[moderation] action failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Moderation action failed." };
  }
}
