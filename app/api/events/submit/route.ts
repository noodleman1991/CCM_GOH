import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eventSubmissionSchema, toEventPlace } from "@/lib/validation/event";
import {
  countPendingEventSuggestions,
  getEventEditGate,
  getEventSuggestionSettings,
  submitEvent,
  updateEvent,
  type EventInput,
} from "@/lib/content/discovery";
import { addOutput } from "@/lib/actions/workspace-outputs";
import { rateLimitRequest } from "@/lib/rate-limit-route";
import { captureAfterResponse } from "@/lib/analytics/server";
import { formErrorResponse } from "@/lib/api/form-error";
import { ERROR_KEYS } from "@/lib/validation/error-keys";
import { suggestionRefusal, type SuggestionRefusal } from "@/lib/events/suggestion-guard";

const REFUSAL: Record<Exclude<SuggestionRefusal, "signIn">, { key: (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS]; status: number }> = {
  paused: { key: ERROR_KEYS.eventSuggestionsPaused, status: 403 },
  blocked: { key: ERROR_KEYS.eventSuggestionsBlocked, status: 403 },
  tooMany: { key: ERROR_KEYS.eventSuggestionsTooMany, status: 429 },
};

/**
 * Member/project suggestion of an event. Creates a PENDING `event` for editor
 * review. Only approved events are public; status is forced to "pending"
 * regardless of input. Open to any signed-in member (events spec E1/E5) —
 * behind the editors' switch, their block list and the cap of 5 waiting.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, "event:submit", { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return formErrorResponse({ request, formKey: ERROR_KEYS.formGeneric });
  }

  // All three editor controls, checked here and nowhere else (spec §3.3).
  const isEdit = Boolean((body as { editId?: unknown } | null)?.editId);
  const [settings, pendingCount] = await Promise.all([getEventSuggestionSettings(), countPendingEventSuggestions(userId)]);
  const refusal = suggestionRefusal({ userId, open: settings.open, blocked: settings.blocked, pendingCount, isEdit });
  if (refusal && refusal !== "signIn") {
    return formErrorResponse({ request, formKey: REFUSAL[refusal].key, status: REFUSAL[refusal].status });
  }

  const parsed = eventSubmissionSchema.safeParse(body);
  if (!parsed.success) return formErrorResponse({ request, issues: parsed.error, input: body });
  const data = parsed.data;

  const fields: Omit<EventInput, "submittedBy"> = {
    title: data.title,
    description: data.description || null,
    scope: data.scope,
    startAt: data.startAt,
    endAt: data.endAt || null,
    mode: data.mode,
    locationName: data.locationName || null,
    url: data.url || null,
    linkedProject: data.scope === "project" ? data.linkedProject || null : null,
    regionalCommunityId: data.regionalCommunityId || undefined,
    relatedCollaboration: data.collaborationId || undefined,
    origin: data.origin,
    organiserName: data.origin === "external" ? data.organiserName || null : null,
    place: data.mode === "online" ? null : toEventPlace(data.place),
  };

  try {
    // X7 edit mode: resubmit an existing draft/pending event — verify the
    // caller may edit it, then patch (status returns to pending for
    // re-review). Slug and submittedBy are preserved.
    if (data.editId) {
      const existing = await getEventEditGate(data.editId);
      const editable = existing && ["pending", "revision", "draft", null].includes(existing.status ?? null);
      const isSubmitter = existing?.submittedBy === userId;
      let isWorkspaceMember = false;
      if (existing && !isSubmitter) {
        const { prisma } = await import("@/lib/prisma");
        const row = await prisma.workspaceOutput.findFirst({
          where: {
            sanityId: { in: [existing._id, existing._id.replace(/^drafts\./, "")] },
            collaboration: { members: { some: { userId } } },
          },
          select: { id: true },
        });
        isWorkspaceMember = !!row;
      }
      if (!existing || !editable || (!isSubmitter && !isWorkspaceMember)) {
        return formErrorResponse({ request, formKey: ERROR_KEYS.formNotAllowed, status: 403 });
      }

      await updateEvent(existing._id, fields);
      captureAfterResponse({
          event: "submission_submitted",
          distinctId: userId,
          properties: { kind: "event", is_resubmission: true, has_image: false },
        });
      // The workspace-output row (if any) already exists — no link-back.
      return NextResponse.json({ success: true, id: existing._id });
    }

    const created = await submitEvent({ ...fields, submittedBy: userId });

    captureAfterResponse({
        event: "submission_submitted",
        distinctId: userId,
        properties: { kind: "event", is_resubmission: false, has_image: false },
      });

    // Submitted from a workspace: link the event as a workspace output.
    // addOutput enforces collab authz; a failed link never fails submission.
    if (data.collaborationId) {
      const linked = await addOutput({
        collaborationId: data.collaborationId,
        sanityType: "event",
        mode: "link",
        sanityId: created.id,
        title: data.title,
      });
      if (!linked.ok) console.warn(`Workspace link failed for ${created.id}: ${linked.error}`);
    }

    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error("Event submission failed:", error);
    return formErrorResponse({ request, formKey: ERROR_KEYS.formGeneric, status: 500 });
  }
}
