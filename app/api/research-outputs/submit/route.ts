import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/lib/write-client";
import {
  researchOutputSubmissionSchema,
  generateResearchOutputSlug,
  RO_DOC_MAX_BYTES,
  RO_DOC_MIME_TYPES,
} from "@/lib/validation/research-output";
import { addOutput } from "@/lib/actions/workspace-outputs";

/**
 * Member/project submission of a research output (report / toolkit / dataset
 * brief / guideline). Creates a PENDING `researchOutput` for editor review —
 * status is forced to "pending" regardless of input (the Studio schema
 * defaults to approved, which is exactly why this route must never trust it).
 *
 * Multipart: `data` JSON + downloadable documents as `version-<i>` files,
 * described positionally by data.newVersions[i] (kind + lang). Files upload
 * to Sanity's asset store and land in the `versions` array the public detail
 * page already renders.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: unknown;
  const files: File[] = [];
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    const dataString = formData.get("data");
    if (typeof dataString !== "string") {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }
    try {
      body = JSON.parse(dataString);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in data field" }, { status: 400 });
    }
    for (let i = 0; ; i++) {
      const f = formData.get(`version-${i}`);
      if (!(f instanceof File)) break;
      files.push(f);
    }
  } else {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const parsed = researchOutputSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const lang = data.language;

  // Every declared document needs its file, and every file its declaration.
  if (files.length !== data.newVersions.length) {
    return NextResponse.json({ error: "Document metadata mismatch" }, { status: 400 });
  }
  for (const f of files) {
    if (f.size > RO_DOC_MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum size is 50MB." }, { status: 400 });
    }
    if (!RO_DOC_MIME_TYPES.includes(f.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, Word, Excel, PowerPoint." },
        { status: 400 }
      );
    }
  }

  // Localized objects: English is the schema-required key; the submission
  // language keeps its own copy when it isn't English.
  const localized = (value: string | undefined) =>
    value ? { en: value, ...(lang !== "en" ? { [lang]: value } : {}) } : undefined;

  const doc: { _type: string; [key: string]: unknown } = {
    _type: "researchOutput",
    status: "pending", // never trust client; always pending on submit
    submittedBy: userId,
    title: localized(data.title),
    slug: { _type: "slug", current: generateResearchOutputSlug(data.title) },
    outputType: data.outputType,
    excerpt: localized(data.excerpt || undefined),
    region: data.region || undefined,
    themes: data.themes.length > 0 ? data.themes : undefined,
    year: new Date().getFullYear(),
  };
  if (Array.isArray(data.body) && data.body.length > 0) doc.body = data.body;
  if (data.tagIds.length > 0) {
    doc.tags = data.tagIds.map((id) => ({ _type: "reference", _ref: id, _key: id }));
  }
  if (data.communityIds.length > 0) {
    doc.relatedCommunities = data.communityIds.map((id) => ({ _type: "reference", _ref: id, _key: id }));
  }

  try {
    // Upload the documents first, then reference them as version items.
    const newVersionItems: Record<string, unknown>[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const meta = data.newVersions[i];
      const sanitizedFilename = f.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);
      const buffer = await f.arrayBuffer();
      const asset = await writeClient.assets.upload("file", Buffer.from(buffer), {
        filename: sanitizedFilename,
        contentType: f.type,
      });
      newVersionItems.push({
        _type: "documentVersion",
        _key: crypto.randomUUID(),
        kind: meta.kind,
        lang: meta.lang,
        file: { _type: "file", asset: { _type: "reference", _ref: asset._id } },
      });
    }

    // X7 edit mode: resubmit an existing draft/pending doc — verify the
    // caller may edit it, then patch (status returns to pending for
    // re-review). Slug and submittedBy are preserved; versions become
    // kept-existing + newly-uploaded.
    if (data.editId) {
      const existing = await writeClient
        .withConfig({ perspective: "raw" })
        .fetch(
          `*[_type == "researchOutput" && _id == $id][0]{ _id, submittedBy, status, versions }`,
          { id: data.editId }
        );
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

      const kept = Array.isArray(existing.versions)
        ? existing.versions.filter((v: { _key?: string }) => v._key && data.keptVersionKeys.includes(v._key))
        : [];
      const versions = [...kept, ...newVersionItems];

      const { _type: _t, slug: _slug, submittedBy: _sb, year: _y, ...updatable } = doc;
      // JSON drops undefined, so cleared optional fields must be unset explicitly.
      const cleared = Object.keys(updatable).filter(
        (k) => updatable[k as keyof typeof updatable] === undefined
      );
      if (!Array.isArray(data.body) || data.body.length === 0) cleared.push("body");
      if (data.tagIds.length === 0) cleared.push("tags");
      if (data.communityIds.length === 0) cleared.push("relatedCommunities");
      const set = Object.fromEntries(Object.entries(updatable).filter(([, v]) => v !== undefined));
      let patch = writeClient
        .patch(existing._id)
        .set({ ...set, versions, status: "pending" });
      if (cleared.length > 0) patch = patch.unset(cleared);
      await patch.commit();
      // The workspace-output row (if any) already exists — no link-back.
      return NextResponse.json({ success: true, id: existing._id });
    }

    if (newVersionItems.length > 0) doc.versions = newVersionItems;
    const created = await writeClient.create(doc);

    // Submitted from a workspace: link the new doc as a workspace output.
    // addOutput enforces collab authz; a failed link never fails submission.
    if (data.collaborationId) {
      const linked = await addOutput({
        collaborationId: data.collaborationId,
        sanityType: "researchOutput",
        mode: "link",
        sanityId: created._id,
        title: data.title,
      });
      if (!linked.ok) console.warn(`Workspace link failed for ${created._id}: ${linked.error}`);
    }

    return NextResponse.json({ success: true, id: created._id });
  } catch (error) {
    console.error("Research output submission failed:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
