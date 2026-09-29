import { describe, expect, it } from "vitest";
import config from "@payload-config";

describe("admin menu groups", () => {
  it("uses the four plain groups (plus Media)", async () => {
    const c = await config;
    const groups = new Set([...c.collections, ...(c.globals ?? [])].map((x) => x.admin?.group).filter((g): g is string => typeof g === "string"));
    expect([...groups].sort()).toEqual(["Hub content", "Media", "People & organisations", "Settings", "Site pages"]);
  });
});
