import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toFieldIssues, translateIssues, valueAt } from "@/lib/validation/messages";
import { ERROR_KEYS } from "@/lib/validation/error-keys";

const t = Object.assign(
  (key: string, values?: Record<string, string | number>) => `${key}${values ? JSON.stringify(values) : ""}`,
  { has: (key: string) => !key.startsWith("zod:") },
);

describe("toFieldIssues", () => {
  it("keeps the first problem per field and carries min/max", () => {
    const schema = z.object({ title: z.string().min(5, ERROR_KEYS.titleTooShort).max(10, ERROR_KEYS.tooLong) });
    const result = schema.safeParse({ title: "abc" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldIssues(result.error)).toEqual([{ path: "title", key: "title.tooShort", values: { min: 5 } }]);
  });

  it("reads values from custom issues' params", () => {
    const schema = z.object({ a: z.string() }).superRefine((_, ctx) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["excerpt", "en"], message: ERROR_KEYS.englishSummaryTooShort, params: { min: 20 } }),
    );
    const result = schema.safeParse({ a: "x" });
    if (result.success) throw new Error("expected failure");
    expect(toFieldIssues(result.error)[0]).toEqual({ path: "excerpt.en", key: "englishSummary.tooShort", values: { min: 20 } });
  });
});

describe("translateIssues", () => {
  it("adds the current count for text and lists", () => {
    const sentences = translateIssues([{ path: "excerpt.ar", key: "summary.tooShort", values: { min: 50 } }], t, { excerpt: { ar: "قصير" } });
    expect(sentences["excerpt.ar"]).toBe('summary.tooShort{"min":50,"count":4}');
  });

  it("turns a message that is not one of our keys into the generic fix sentence", () => {
    const sentences = translateIssues([{ path: "x", key: "zod:Required" }], t);
    expect(sentences.x).toBe("form.fixBelow");
  });
});

describe("valueAt", () => {
  it("walks dotted paths including array indexes", () => {
    expect(valueAt({ authors: [{ name: "A" }, { name: "B" }] }, "authors.1.name")).toBe("B");
    expect(valueAt({}, "a.b")).toBeUndefined();
  });
});
