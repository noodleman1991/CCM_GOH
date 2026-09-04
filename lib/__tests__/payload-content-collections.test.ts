import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";
import {
  approvedOnly,
  isAnyone,
  isEditor,
  moderationApprovedOnly,
  ownerOrEditor,
  publishedAndApproved,
  publishedOnly,
} from "@/payload/access";
import { CaseStudies } from "@/payload/collections/case-studies";
import { LivedExperiences } from "@/payload/collections/lived-experiences";
import { ResearchOutputs } from "@/payload/collections/research-outputs";
import { Agendas } from "@/payload/collections/agendas";
import { NewsPosts } from "@/payload/collections/news-posts";
import { DocsChapters } from "@/payload/collections/docs-chapters";
import { Testimonials } from "@/payload/collections/testimonials";
import { ProfilePrompts } from "@/payload/collections/profile-prompts";
import { ExternalSources } from "@/payload/collections/external-sources";
import { CaseStudyDrafts } from "@/payload/collections/case-study-drafts";

const collections: CollectionConfig[] = [
  CaseStudies,
  LivedExperiences,
  ResearchOutputs,
  Agendas,
  NewsPosts,
  DocsChapters,
  Testimonials,
  ProfilePrompts,
  ExternalSources,
  CaseStudyDrafts,
];

function findField(fields: Field[], name: string): Field | undefined {
  return fields.find((f) => "name" in f && f.name === name);
}

describe("payload content collections", () => {
  it("defines exactly the ten content collection slugs", () => {
    const slugs = collections.map((c) => c.slug).sort();
    expect(slugs).toEqual([
      "agendas",
      "caseStudies",
      "caseStudyDrafts",
      "docsChapters",
      "externalSources",
      "livedExperiences",
      "newsPosts",
      "profilePrompts",
      "researchOutputs",
      "testimonials",
    ]);
  });

  it("has no duplicate slugs", () => {
    const slugs = collections.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every collection a hidden, required, text 'id' field at the root of fields — Sanity's _id, preserved verbatim", () => {
    for (const c of collections) {
      const idField = findField(c.fields, "id");
      expect(idField, `${c.slug} is missing a root-level 'id' field`).toBeTruthy();
      expect(idField).toMatchObject({
        name: "id",
        type: "text",
        required: true,
        admin: { hidden: true },
      });
    }
  });

  it("never sets idType: 'uuid' anywhere — every custom id field is text", () => {
    for (const c of collections) {
      const idField = findField(c.fields, "id");
      expect((idField as { type?: string } | undefined)?.type).toBe("text");
    }
  });

  it("enables versions.drafts on exactly the four collections with real Sanity drafts (livedExperience 21, caseStudy 1, newsPost 1, testimonial 1 — the never-published one)", () => {
    expect(CaseStudies.versions).toMatchObject({ drafts: true });
    expect(LivedExperiences.versions).toMatchObject({ drafts: true });
    expect(NewsPosts.versions).toMatchObject({ drafts: true });
    expect(Testimonials.versions).toMatchObject({ drafts: true });
  });

  it("does not enable versions.drafts on the six collections with zero real Sanity drafts", () => {
    for (const c of [ResearchOutputs, Agendas, DocsChapters, ProfilePrompts, ExternalSources, CaseStudyDrafts]) {
      expect(c.versions).toBeFalsy();
    }
  });

  it("keeps a moderation 'moderationStatus' field distinct from Payload's built-in _status on the three collections that have one in Sanity (caseStudy, livedExperience, researchOutput) — newsPost has none in the schema", () => {
    for (const c of [CaseStudies, LivedExperiences, ResearchOutputs]) {
      const status = findField(c.fields, "moderationStatus");
      expect(status, `${c.slug} is missing its editorial 'moderationStatus' field`).toMatchObject({ name: "moderationStatus", type: "select" });
    }
    expect(findField(NewsPosts.fields, "moderationStatus")).toBeUndefined();
    // Never named "status" — that collides with Payload's internal _status
    // field's generated Postgres enum type once versions.drafts is enabled
    // (a real failed migration proved this; see case-studies.ts's header).
    for (const c of collections) {
      expect(findField(c.fields, "status")).toBeUndefined();
      expect(findField(c.fields, "_status")).toBeUndefined();
    }
  });

  it("models livedExperience.region as a relationship to regionalCommunities, not a select of region codes — 100% of real data is a reference, 0% a string code", () => {
    const region = findField(LivedExperiences.fields, "region");
    expect(region).toMatchObject({ name: "region", type: "relationship", relationTo: "regionalCommunities" });
  });

  it("models researchOutput.region and newsPost.region as select fields (fixed-7 region codes) — real data matches the schema for these two types", () => {
    for (const c of [ResearchOutputs, NewsPosts]) {
      const region = findField(c.fields, "region");
      expect(region).toMatchObject({ name: "region", type: "select" });
    }
  });

  it("adds livedExperience.videoUrl even though it's absent from the Sanity schema — real data (56/56) and read throughout lib/content/*.ts", () => {
    const videoUrl = findField(LivedExperiences.fields, "videoUrl");
    expect(videoUrl).toMatchObject({ name: "videoUrl", type: "text" });
  });

  it("models caseStudyDraft.tags/selectedTags/relatedCommunity on the stored shape (plain strings), not the schema's reference shape", () => {
    const tags = findField(CaseStudyDrafts.fields, "tags");
    expect((tags as { type?: string } | undefined)?.type).toBe("array");
    const relatedCommunity = findField(CaseStudyDrafts.fields, "relatedCommunity");
    expect(relatedCommunity).toMatchObject({ name: "relatedCommunity", type: "text" });
  });

  it("gates every caseStudyDrafts operation on owner-or-editor — an owner must not be able to write what it cannot read", () => {
    // Private per-user autosave data, not public content like the other nine
    // collections; and `read` used to be `isEditor` while the three writes
    // were `ownerOrEditor`, so an owner could save a draft and then be denied
    // it back. `ownerOrEditor` is a `Where` on the persisted `userId`, so this
    // still hides one member's draft from another and still gives editors the
    // whole in-progress queue.
    for (const op of ["read", "create", "update", "delete"] as const) {
      expect(CaseStudyDrafts.access?.[op], op).toBe(ownerOrEditor);
      // Not editor-only — that would be indistinguishable from the (wrong) old shape.
      expect(CaseStudyDrafts.access?.[op], op).not.toBe(isEditor);
    }
  });

  it("gives an anonymous caller nothing on caseStudyDrafts", () => {
    // `ownerOrEditor` is looser than `isEditor`, so the widening has to be
    // shown to stop at the owner: with no signed-in user there is no clerkId,
    // and the helper returns false rather than an unscoped query.
    expect(CaseStudyDrafts.access!.read!({ req: { user: null } } as never)).toBe(false);
    expect(
      CaseStudyDrafts.access!.read!({ req: { user: { role: "community_member", clerkId: "u1" } } } as never),
    ).toEqual({ userId: { equals: "u1" } });
    expect(
      CaseStudyDrafts.access!.read!({ req: { user: { role: "team_editor", clerkId: "e1" } } } as never),
    ).toBe(true);
  });

  it("does not port 'projects'/'project' relationship fields — the target document type has zero live documents in production_2", () => {
    for (const c of [CaseStudies, LivedExperiences, NewsPosts, ExternalSources]) {
      expect(findField(c.fields, "projects")).toBeUndefined();
    }
    expect(findField(Testimonials.fields, "project")).toBeUndefined();
  });

  it("does not port 'relatedContent' (the connection object) — zero real usage across the three collections that declare it", () => {
    for (const c of [CaseStudies, LivedExperiences, ResearchOutputs]) {
      expect(findField(c.fields, "relatedContent")).toBeUndefined();
    }
  });

  it("does not model a document-level 'language' field on livedExperience or newsPost — Payload's localized:true replaces it", () => {
    expect(findField(LivedExperiences.fields, "language")).toBeUndefined();
    expect(findField(NewsPosts.fields, "language")).toBeUndefined();
  });

  it("models docsChapter's title/body as plain, non-localized fields — the only collection with no localized fields in its Sanity schema", () => {
    // toMatchObject is a subset match: a localized field (localized: true)
    // would satisfy {name, type} identically, so the localized:true check
    // has to be explicit or this test cannot detect the mistake it names.
    const title = findField(DocsChapters.fields, "title");
    expect(title).toMatchObject({ name: "title", type: "text" });
    expect(title).not.toHaveProperty("localized");
    const body = findField(DocsChapters.fields, "body");
    expect(body).toMatchObject({ name: "body", type: "richText" });
    expect(body).not.toHaveProperty("localized");
  });

  it("agendas.files requires at least one file, mirroring the schema's Rule.required().min(1)", () => {
    const files = findField(Agendas.fields, "files");
    expect(files).toMatchObject({ name: "files", type: "array", required: true, minRows: 1 });
  });

  // Pins the exact read-access function per collection so a regression like
  // "publishedOnly gates only _status, never moderationStatus" (the
  // published-but-pending caseStudies 2U42vBhgRaBYxnTE6w726U/
  // pbVPtgVbwyH6oOhWZ3wD3a were anonymously readable through this gap) can't
  // silently reappear. caseStudies/livedExperiences need BOTH _status and
  // moderationStatus gated (publishedAndApproved); researchOutputs has no
  // _status field at all (no versions.drafts) so moderationStatus alone
  // gates it (moderationApprovedOnly); externalSources gates on its own
  // `approved` boolean (approvedOnly); newsPosts/testimonials have _status
  // but no moderationStatus, so publishedOnly is correct as-is;
  // agendas/docsChapters/profilePrompts have neither, so isAnyone is
  // correct; caseStudyDrafts is private per-user autosave data, read by its
  // owner or an editor and nobody else.
  it("pins each collection's read access to the correct function — the one axis with a security consequence", () => {
    const expected: Array<[CollectionConfig, unknown]> = [
      [CaseStudies, publishedAndApproved],
      [LivedExperiences, publishedAndApproved],
      [ResearchOutputs, moderationApprovedOnly],
      [Agendas, isAnyone],
      [NewsPosts, publishedOnly],
      [DocsChapters, isAnyone],
      [Testimonials, publishedOnly],
      [ProfilePrompts, isAnyone],
      [ExternalSources, approvedOnly],
      [CaseStudyDrafts, ownerOrEditor],
    ];
    for (const [collection, accessFn] of expected) {
      expect(collection.access?.read, `${collection.slug}.access.read`).toBe(accessFn);
    }
  });

  it("never lets a plain publishedOnly/isAnyone gate a collection that also carries a moderation field", () => {
    // caseStudies/livedExperiences/researchOutputs all declare
    // moderationStatus; none of them may use publishedOnly or isAnyone for
    // read — both would skip the moderation check entirely.
    for (const c of [CaseStudies, LivedExperiences, ResearchOutputs]) {
      expect(c.access?.read).not.toBe(publishedOnly);
      expect(c.access?.read).not.toBe(isAnyone);
    }
    // externalSources declares its own `approved` boolean; isAnyone would skip it.
    expect(ExternalSources.access?.read).not.toBe(isAnyone);
  });
});
