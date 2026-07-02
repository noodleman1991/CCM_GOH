import { describe, it, expect } from "vitest";
import { ConversationKind } from "@/generated/prisma";

describe("ConversationKind", () => {
  it("exposes the three kinds", () => {
    expect(ConversationKind.DIRECT).toBe("DIRECT");
    expect(ConversationKind.PROJECT).toBe("PROJECT");
    expect(ConversationKind.COMMUNITY).toBe("COMMUNITY");
  });
});
