import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/validation/limits";
import { makeCaseStudySubmissionSchema } from "@/lib/validation/case-study";
import { livedExperienceSubmissionSchema } from "@/lib/validation/lived-experience";
import { researchOutputSubmissionSchema } from "@/lib/validation/research-output";
import { eventSubmissionSchema } from "@/lib/validation/event";
import { createOnboardingSchema } from "@/lib/schemas/onboarding-schema";

/**
 * Slice 13a (P2). One character-limit map, consumed by the server zod, the
 * client zod, the input's `maxLength` and its counter. Before this, case-study
 * title/excerpt/author/organisation were unbounded on both ends, and most
 * other fields were capped on the server only — so a member could type 2,000
 * characters into a headline and learn about the 120 limit from a 400.
 *
 * Two kinds of check: the server schemas reject max+1 and accept max, and no
 * string field in the listed files carries a numeric `.max(` of its own.
 */
const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const s = (n: number) => "x".repeat(n);

function acceptsExactly(parse: (text: string) => boolean, max: number, label: string) {
  expect(parse(s(max)), `${label}: ${max} chars should be accepted`).toBe(true);
  expect(parse(s(max + 1)), `${label}: ${max + 1} chars should be rejected`).toBe(false);
}

describe("server schemas follow LIMITS", () => {
  it("case study", () => {
    const caseStudySchema = makeCaseStudySubmissionSchema({ themeTagIds: new Set(["t1"]) });
    const base = {
      title: { en: "A title" },
      excerpt: { en: "e".repeat(50) },
      content: [{ _type: "block", children: [{ _type: "span", text: "Story." }] }],
      authors: [{ name: "A" }],
      tags: ["t1"],
      relatedCommunity: "c1",
    };
    acceptsExactly((t) => caseStudySchema.safeParse({ ...base, title: { en: t } }).success, LIMITS.caseStudy.title, "title");
    acceptsExactly((t) => caseStudySchema.safeParse({ ...base, excerpt: { en: t } }).success, LIMITS.caseStudy.excerpt, "excerpt");
    acceptsExactly((t) => caseStudySchema.safeParse({ ...base, authors: [{ name: t }] }).success, LIMITS.caseStudy.authorName, "author name");
    acceptsExactly((t) => caseStudySchema.safeParse({ ...base, organizationName: t }).success, LIMITS.caseStudy.organizationName, "organisation");
  });

  it("lived experience", () => {
    const base = { title: "ttt", description: "d".repeat(10), issue: "iiiii", videoSource: "youtube", videoLink: "https://www.youtube.com/watch?v=abcdefghijk", regionalCommunityId: "rc" };
    const ok = (o: Record<string, unknown>) => livedExperienceSubmissionSchema.safeParse({ ...base, ...o }).success;
    acceptsExactly((t) => ok({ title: t }), LIMITS.livedExperience.title, "title");
    acceptsExactly((t) => ok({ description: t }), LIMITS.livedExperience.description, "description");
    acceptsExactly((t) => ok({ issue: t }), LIMITS.livedExperience.issue, "issue");
    acceptsExactly((t) => ok({ personContext: t }), LIMITS.livedExperience.personContext, "personContext");
  });

  it("research output and event", () => {
    const ro = (o: Record<string, unknown>) => researchOutputSubmissionSchema.safeParse({ title: "ttt", outputType: "report", region: "ssa", language: "en", ...o }).success;
    acceptsExactly((t) => ro({ title: t }), LIMITS.researchOutput.title, "title");
    acceptsExactly((t) => ro({ excerpt: t }), LIMITS.researchOutput.excerpt, "excerpt");
    const ev = (o: Record<string, unknown>) => eventSubmissionSchema.safeParse({ title: "ttt", startAt: "2026-10-01T10:00:00.000Z", ...o }).success;
    acceptsExactly((t) => ev({ title: t }), LIMITS.event.title, "title");
    acceptsExactly((t) => ev({ description: t }), LIMITS.event.description, "description");
  });

  it("onboarding basic info and recent work", () => {
    const schema = createOnboardingSchema();
    const basic = { firstName: "A", lastName: "B", username: "abc", country: "X", city: "Y", preferredLanguage: "EN" };
    const ok = (o: Record<string, unknown>) => schema.shape.basicInfo.safeParse({ ...basic, ...o }).success;
    acceptsExactly((t) => ok({ bio: t }), LIMITS.profile.bio, "bio");
    acceptsExactly((t) => ok({ pronouns: t }), LIMITS.profile.pronouns, "pronouns");
    // Headline and motivation are asked in the About you step (dashboard/profile spec D4).
    const about = (o: Record<string, unknown>) => schema.shape.aboutYou.safeParse(o).success;
    acceptsExactly((t) => about({ headline: t }), LIMITS.profile.headline, "headline");
    acceptsExactly((t) => about({ motivation: t }), LIMITS.profile.motivation, "motivation");
    acceptsExactly((t) => about({ collaborationInterests: t }), LIMITS.profile.collaborationInterests, "collaboration interests");
    const work = (o: Record<string, unknown>) => schema.shape.recentWork.safeParse([{ title: "t", description: "d", isOngoing: true, startDate: "2025-01", ...o }]).success;
    acceptsExactly((t) => work({ title: t }), LIMITS.recentWork.title, "work title");
    acceptsExactly((t) => work({ description: t }), LIMITS.recentWork.description, "work description");
  });
});

describe("no string field keeps a private numeric max", () => {
  const files = [
    "lib/validation/case-study.ts",
    "lib/validation/lived-experience.ts",
    "lib/validation/research-output.ts",
    "lib/validation/event.ts",
    "lib/schemas/onboarding-schema.ts",
    "app/api/onboarding/complete/route.ts",
    "app/api/profile/route.ts",
    "lib/actions/collaboration.ts",
    "lib/actions/plans.ts",
    "lib/actions/docs.ts",
    "components/forms/case-study/story-section.tsx",
    "components/forms/case-study/people-section.tsx",
    "components/forms/research-output-form.tsx",
    "components/blocks/profile/profile-edit-form.tsx",
  ];
  it.each(files)("%s", (f) => {
    const src = read(f);
    // `z.string()….max(120)` is what we forbid; `z.array(...).max(6)` is a count, not a length.
    const offenders = [...src.matchAll(/z\s*\.string\(\)(?!\))[^\n]*?(?<!\)\))\.max\(\s*(\d+)/g)].map((m) => m[0]);
    expect(offenders).toEqual([]);
    expect(src).toMatch(/LIMITS\./);
  });
});

describe("inputs carry the same cap as the schema", () => {
  it.each([
    // The case study form's inputs live in its section components.
    ["components/forms/case-study/story-section.tsx", ["LIMITS.caseStudy.title", "LIMITS.caseStudy.excerpt"]],
    ["components/forms/case-study/people-section.tsx", ["LIMITS.caseStudy.organizationName"]],
    ["components/forms/lived-experience-form.tsx", ["LIMITS.livedExperience.title", "LIMITS.livedExperience.description", "LIMITS.livedExperience.issue", "LIMITS.livedExperience.personContext"]],
    ["components/forms/research-output-form.tsx", ["LIMITS.researchOutput.title", "LIMITS.researchOutput.excerpt"]],
    ["components/blocks/profile/profile-edit-form.tsx", ["LIMITS.profile.headline", "LIMITS.profile.bio", "LIMITS.profile.workBio"]],
    ["components/onboarding/panels/basic-info-panel.tsx", ["LIMITS.profile.bio", "LIMITS.profile.pronouns"]],
    ["components/onboarding/panels/about-you-panel.tsx", ["LIMITS.profile.headline", "LIMITS.profile.motivation", "LIMITS.profile.promptAnswer", "LIMITS.profile.collaborationInterests"]],
    ["components/onboarding/panels/recent-work-panel.tsx", ["LIMITS.recentWork.title", "LIMITS.recentWork.description"]],
  ] as const)("%s", (f, refs) => {
    const src = read(f);
    for (const ref of refs) expect(src, `${f} should bind maxLength={${ref}}`).toMatch(new RegExp(`maxLength=\\{${ref.replace(/\./g, "\\.")}\\}`));
    expect(src).toContain("<CharCounter");
  });

  it("InlineText takes a maxLength and every workspace site passes one", () => {
    expect(read("components/ui/inline-text.tsx")).toMatch(/maxLength\?: number/);
    for (const f of ["workspace-shell", "workspace-plan", "workspace-docs", "workspace-threads"]) {
      const src = read(`components/collaboration/${f}.tsx`);
      const sites = src.match(/<InlineText/g)?.length ?? 0;
      const capped = src.match(/maxLength=\{LIMITS\.collaboration\./g)?.length ?? 0;
      expect(capped, `${f}: ${sites} InlineText sites, ${capped} capped`).toBe(sites);
    }
  });
});
