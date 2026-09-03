import { describe, expect, it } from "vitest";
import config from "@payload-config";

describe("payload config", () => {
  it("declares the four locales with Arabic marked RTL", async () => {
    const c = await config;
    const codes = c.localization ? c.localization.locales.map((l) => (typeof l === "string" ? l : l.code)) : [];
    expect(codes).toEqual(["en", "es", "fr", "ar"]);
    expect(c.localization && c.localization.defaultLocale).toBe("en");
    const ar = c.localization && c.localization.locales.find((l) => typeof l !== "string" && l.code === "ar");
    expect(ar && (ar as { rtl?: boolean }).rtl).toBe(true);
  });

  it("does not pin idType to uuid — 310 Sanity ids are slug-like", async () => {
    const c = await config;
    expect(JSON.stringify(c.db ?? {})).not.toContain("uuid");
  });
});
