import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/lib/write-client";
import {
  livedExperienceSubmissionSchema,
  generateLivedExperienceSlug,
} from "@/lib/validation/lived-experience";

/**
 * User submission of a lived experience. Creates a PENDING livedExperience for
 * editor review (mirrors the case-study flow). Only approved docs are public,
 * enforced in the read queries; status starts as "pending" regardless of input.
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

  const parsed = livedExperienceSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const lang = data.language;

  // Localized objects with the submitter's language populated.
  const localized = (value: string) => (value ? { [lang]: value } : undefined);

  const doc: { _type: string; [key: string]: unknown } = {
    _type: "livedExperience",
    language: lang,
    status: "pending", // never trust client; always pending on submit
    submittedBy: userId,
    publishedAt: new Date().toISOString(),
    slug: { _type: "slug", current: generateLivedExperienceSlug(data.title) },
    title: { [lang]: data.title },
    description: localized(data.description),
    issue: localized(data.issue),
    personContext: localized(data.personContext || ""),
    videoLink: data.videoLink,
    featured: false,
  };

  if (data.regionalCommunityId) {
    doc.relatedCommunity = { _type: "reference", _ref: data.regionalCommunityId };
  }
  if (data.tagIds && data.tagIds.length > 0) {
    doc.tags = data.tagIds.map((id) => ({ _type: "reference", _ref: id, _key: id }));
  }

  try {
    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, id: created._id });
  } catch (error) {
    console.error("Lived experience submission failed:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
