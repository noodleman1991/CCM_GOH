import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import config from "@payload-config";
import { hero1, splitContent } from "@/payload/blocks";

const named = (fields: Field[], name: string) => fields.find((f) => "name" in f && f.name === name) as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any

describe("loading the Payload config leaves the shared block definitions intact", () => {
  it("keeps their translatable fields marked translatable (the homepage move planner reads them)", async () => {
    await config;
    expect(named(hero1.fields, "title")?.localized).toBe(true);
    expect(named(named(hero1.fields, "links")!.fields, "title")?.localized).toBe(true);
    expect(named(splitContent.fields, "title")?.localized).toBe(true);
  });
});
