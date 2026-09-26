import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eventSubmissionSchema } from "@/lib/validation/event";
import { getEventEditGate, submitEvent, updateEvent, type EventInput } from "@/lib/content/discovery";
import { addOutput } from "@/lib/actions/workspace-outputs";
import { rateLimitRequest } from "@/lib/rate-limit-route";
import { FEATURES } from "@/lib/features";
import { captureAfterResponse } from "@/lib/analytics/server";

/**
 * Member/project submission of an event. Creates a PENDING `event` for editor
 * review (mirrors the lived-experience flow). Only approved events are public;
 * status is forced to "pending" regardless of input.
 */
export async function POST(request: NextRequest) {
  if (!FEATURES.engagement) return NextResponse.json({ error: "feature_disabled" }, { status: 403 });
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = eventSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
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
        return NextResponse.json({ error: "You can't edit this submission." }, { status: 403 });
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
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
