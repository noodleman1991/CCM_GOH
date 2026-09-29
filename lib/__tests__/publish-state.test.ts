import { describe, expect, it } from "vitest";
import { publishStateMessage } from "@/payload/components/publish-state-message";
import { statusLine } from "@/payload/components/translation-status";
import config from "@payload-config";

describe("publish state", () => {
  it("says in words what visitors see", () => {
    expect(publishStateMessage({ hasPublishedDoc: false, unpublishedVersionCount: 0 })).toBe("Not published yet — visitors can't see this.");
    expect(publishStateMessage({ hasPublishedDoc: true, unpublishedVersionCount: 2 })).toBe("Visitors still see the published version. You have unpublished changes.");
    expect(publishStateMessage({ hasPublishedDoc: true, unpublishedVersionCount: 0 })).toBe("Everything you see is live.");
  });
  it("sits at the top of every document that has drafts", async () => {
    const c = await config;
    for (const item of [...c.collections, ...(c.globals ?? [])]) {
      const drafts = typeof item.versions === "object" && item.versions && "drafts" in item.versions && item.versions.drafts;
      if (!drafts) continue;
      expect([item.slug, "name" in item.fields[0] ? item.fields[0].name : null]).toEqual([item.slug, "publishState"]);
    }
  });
  it("renames the draft buttons", async () => {
    const t = (await config).i18n?.translations as Record<string, Record<string, Record<string, string>>>;
    expect(t.en.version.saveDraft).toBe("Save without publishing");
    expect(t.en.version.revertToPublished).toBe("Discard my changes");
    expect(t.en.general.locale).toBe("Editing");
  });
});

describe("translation line", () => {
  it("says what is missing in words", () => {
    expect(statusLine({ en: "complete", es: "missing", fr: "complete", ar: "missing" }).text).toBe("Not translated yet: ES, AR — visitors see English");
    expect(statusLine({ en: "complete", es: "complete", fr: "complete", ar: "complete" }).text).toBe("Translated ✓");
  });
});
