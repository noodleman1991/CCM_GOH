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
