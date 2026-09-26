import { describe, expect, it, vi } from "vitest";
import config from "@/payload.config";
import { baseSlug, slugField, sourceText } from "@/payload/fields/slug";

type Hook = (args: Record<string, unknown>) => Promise<unknown>;

function hookOf(field: ReturnType<typeof slugField>): Hook {
  return field.hooks!.beforeValidate![0] as unknown as Hook;
}

function reqWithTaken(taken: string[]) {
  const find = vi.fn(async ({ where }: { where: { and: [{ slug: { equals: string } }] } }) => ({
    docs: taken.includes(where.and[0].slug.equals) ? [{ id: "other" }] : [],
  }));
  return { req: { payload: { find } }, find };
}

const collection = { slug: "newsPosts" };

describe("sourceText", () => {
  it("reads a plain string or the English of a localized value", () => {
    expect(sourceText("  Hello ")).toBe("Hello");
    expect(sourceText({ en: "English", es: "Español" })).toBe("English");
    expect(sourceText({ en: "", ar: "عربي" })).toBe("عربي");
    expect(sourceText({ en: "" })).toBeUndefined();
    expect(sourceText(undefined)).toBeUndefined();
  });
});

describe("baseSlug", () => {
  it("makes a URL-safe slug", () => {
    expect(baseSlug("Éducation & Climate: 2026!", 96)).toBe("education-and-climate-2026");
  });

  it("gives a title with no Latin letters a short random slug", () => {
    expect(baseSlug("تغير المناخ", 96)).toMatch(/^item-[0-9a-f]{8}$/);
  });

  it("respects the length limit without a trailing dash", () => {
    expect(baseSlug("word ".repeat(40), 12)).toBe("word-word-wo");
  });
});

describe("slug hook", () => {
  const field = slugField("title");

  it("makes the slug from the title when left empty", async () => {
    const { req } = reqWithTaken([]);
    await expect(hookOf(field)({ value: "", data: { title: "Floods in Lagos" }, req, collection })).resolves.toBe(
      "floods-in-lagos",
    );
  });

  it("adds -2, -3 when the slug is taken", async () => {
    const { req } = reqWithTaken(["floods-in-lagos", "floods-in-lagos-2"]);
    await expect(hookOf(field)({ value: undefined, data: { title: "Floods in Lagos" }, req, collection })).resolves.toBe(
      "floods-in-lagos-3",
    );
  });

  it("keeps a slug the editor typed", async () => {
    const { req, find } = reqWithTaken([]);
    await expect(hookOf(field)({ value: "my-choice", data: { title: "Other" }, req, collection })).resolves.toBe("my-choice");
    expect(find).not.toHaveBeenCalled();
  });

  it("does not count the document itself as taking its own slug", async () => {
    const { req, find } = reqWithTaken([]);
    await hookOf(field)({ value: "", data: {}, originalDoc: { id: "n1", title: "Kept" }, req, collection });
    const where = (find.mock.calls[0][0] as { where: { and: unknown[] } }).where;
    expect(where.and).toContainEqual({ id: { not_equals: "n1" } });
  });

  it("leaves the slug empty when there is no title yet (a draft)", async () => {
    const { req } = reqWithTaken([]);
    await expect(hookOf(field)({ value: "", data: {}, req, collection })).resolves.toBe("");
  });
});

describe("slug form check", () => {
  const validate = (field: ReturnType<typeof slugField>, value: unknown, data: Record<string, unknown>) =>
    (field.validate as unknown as (v: unknown, o: { data: unknown }) => true | string)(value, { data });

  it("lets an empty slug through while the title has text", () => {
    expect(validate(slugField("title"), "", { title: "A title" })).toBe(true);
  });

  it("asks for the source first when both are empty", () => {
    expect(validate(slugField("name"), "", {})).toBe("Add a name first; the slug is made from it.");
  });

  it("enforces the length limit on a typed slug", () => {
    expect(validate(slugField("title", { maxLength: 5 }), "toolong", {})).toMatch(/5 characters/);
  });
});

describe("every collection with a slug", () => {
  it("fills it automatically", async () => {
    const resolved = await config;
    const withSlug = resolved.collections.flatMap((collection) => {
      const slug = collection.fields.find((field) => "name" in field && field.name === "slug") as
        | { hooks?: { beforeValidate?: unknown[] } }
        | undefined;
      return slug ? [{ collection: collection.slug, slug }] : [];
    });
    expect(withSlug.length).toBeGreaterThanOrEqual(13);
    expect(withSlug.filter(({ slug }) => !slug.hooks?.beforeValidate?.length).map((c) => c.collection)).toEqual([]);
  });
});
