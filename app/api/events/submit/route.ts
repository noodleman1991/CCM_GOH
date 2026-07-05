import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/lib/write-client";
import { eventSubmissionSchema, generateEventSlug } from "@/lib/validation/event";
import { addOutput } from "@/lib/actions/workspace-outputs";

/**
 * Member/project submission of an event. Creates a PENDING `event` for editor
 * review (mirrors the lived-experience flow). Only approved events are public;
 * status is forced to "pending" regardless of input.
 */
export async function POST(request: NextRequest) {
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

  const doc: { _type: string; [key: string]: unknown } = {
    _type: "event",
    status: "pending", // never trust client; always pending on submit
    submittedBy: userId,
    title: data.title,
    slug: { _type: "slug", current: generateEventSlug(data.title) },
    description: data.description || undefined,
    scope: data.scope,
    startAt: data.startAt,
    endAt: data.endAt || undefined,
    mode: data.mode,
    locationName: data.locationName || undefined,
    url: data.url || undefined,
    linkedProject: data.scope === "project" ? data.linkedProject || undefined : undefined,
  };
  if (data.regionalCommunityId) {
    doc.relatedCommunity = { _type: "reference", _ref: data.regionalCommunityId };
  }

  try {
    if (data.collaborationId) doc.relatedCollaboration = data.collaborationId;

    // X7 edit mode: resubmit an existing draft/pending event — verify the
    // caller may edit it, then patch (status returns to pending for
    // re-review). Slug and submittedBy are preserved.
    if (data.editId) {
      const existing = await writeClient
        .withConfig({ perspective: "raw" })
        .fetch(`*[_type == "event" && _id == $id][0]{ _id, submittedBy, status }`, {
          id: data.editId,
        });
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
      const { _type: _t, slug: _slug, submittedBy: _sb, ...updatable } = doc;
      // JSON drops undefined, so cleared optional fields must be unset explicitly.
      const cleared = Object.keys(updatable).filter(
        (k) => updatable[k as keyof typeof updatable] === undefined
      );
      const set = Object.fromEntries(
        Object.entries(updatable).filter(([, v]) => v !== undefined)
      );
      let patch = writeClient.patch(existing._id).set({ ...set, status: "pending" });
      if (cleared.length > 0) patch = patch.unset(cleared);
      await patch.commit();
      // The workspace-output row (if any) already exists — no link-back.
      return NextResponse.json({ success: true, id: existing._id });
    }

    const created = await writeClient.create(doc);

    // Submitted from a workspace: link the event as a workspace output.
    // addOutput enforces collab authz; a failed link never fails submission.
    if (data.collaborationId) {
      const linked = await addOutput({
        collaborationId: data.collaborationId,
        sanityType: "event",
        mode: "link",
        sanityId: created._id,
        title: data.title,
      });
      if (!linked.ok) console.warn(`Workspace link failed for ${created._id}: ${linked.error}`);
    }

    return NextResponse.json({ success: true, id: created._id });
  } catch (error) {
    console.error("Event submission failed:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
