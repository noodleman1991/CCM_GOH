import { describe, expect, it } from "vitest";
import { MAX_PENDING_SUGGESTIONS, suggestionRefusal } from "@/lib/events/suggestion-guard";

const base = { userId: "u1", open: true, blocked: [] as string[], pendingCount: 0, isEdit: false };

describe("who may suggest an event", () => {
  it("lets a signed-in member in when suggestions are open", () => {
    expect(suggestionRefusal(base)).toBeNull();
  });
  it("asks visitors to sign in first", () => {
    expect(suggestionRefusal({ ...base, userId: null })).toBe("signIn");
  });
  it("refuses everyone while suggestions are paused — edits too", () => {
    expect(suggestionRefusal({ ...base, open: false })).toBe("paused");
    expect(suggestionRefusal({ ...base, open: false, isEdit: true })).toBe("paused");
  });
  it("refuses a blocked member — edits too", () => {
    expect(suggestionRefusal({ ...base, blocked: ["u1"] })).toBe("blocked");
    expect(suggestionRefusal({ ...base, blocked: ["u1"], isEdit: true })).toBe("blocked");
  });
  it("refuses a sixth waiting suggestion, but not an edit of one already waiting", () => {
    expect(MAX_PENDING_SUGGESTIONS).toBe(5);
    expect(suggestionRefusal({ ...base, pendingCount: 4 })).toBeNull();
    expect(suggestionRefusal({ ...base, pendingCount: 5 })).toBe("tooMany");
    expect(suggestionRefusal({ ...base, pendingCount: 5, isEdit: true })).toBeNull();
  });
});
