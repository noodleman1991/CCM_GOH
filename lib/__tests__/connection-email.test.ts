import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const db = vi.hoisted(() => ({
  contactRequest: { findFirst: vi.fn() },
  user: { findUnique: vi.fn(async () => ({ email: "miruna@example.org" })) },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
import { connectedEmail, EMAIL_SHARING_SINCE } from "@/lib/collaborate/connection";

beforeEach(() => { db.contactRequest.findFirst.mockReset(); db.user.findUnique.mockClear(); });

describe("contact details between connected people", () => {
  it("are shared once either one accepted the other's request", async () => {
    db.contactRequest.findFirst.mockResolvedValue({ id: "c1" });
    expect(await connectedEmail("me", "miruna")).toBe("miruna@example.org");
    const where = db.contactRequest.findFirst.mock.calls[0][0].where;
    expect(where.status).toBe("ACCEPTED");
    // Only connections accepted once accepting meant sharing contact details.
    expect(where.resolvedAt).toEqual({ gte: EMAIL_SHARING_SINCE });
    expect(where.OR).toEqual([{ requesterId: "me", recipientId: "miruna" }, { requesterId: "miruna", recipientId: "me" }]);
  });
  it("are never shared while pending, after a decline, or with no request", async () => {
    db.contactRequest.findFirst.mockResolvedValue(null);
    expect(await connectedEmail("me", "miruna")).toBeNull();
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
  it("aren't looked up for your own profile or a signed-out viewer", async () => {
    expect(await connectedEmail("me", "me")).toBeNull();
    expect(await connectedEmail("", "miruna")).toBeNull();
    expect(db.contactRequest.findFirst).not.toHaveBeenCalled();
  });
});
