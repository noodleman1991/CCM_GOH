import { describe, expect, it } from "vitest";
import { visibilityNoticeKey } from "@/lib/profile/visibility-notice-key";

describe("visibilityNoticeKey", () => {
  it("names the public case, which is the default and the one that needs the warning", () => {
    expect(visibilityNoticeKey("PUBLIC", true)).toBe("public");
    expect(visibilityNoticeKey(null, null)).toBe("public");
    expect(visibilityNoticeKey("PUBLIC", false)).toBe("publicHidden");
  });

  it("distinguishes members-only and private", () => {
    expect(visibilityNoticeKey("MEMBERS", true)).toBe("members");
    expect(visibilityNoticeKey("MEMBERS", false)).toBe("membersHidden");
    expect(visibilityNoticeKey("PRIVATE", true)).toBe("private");
  });
});
