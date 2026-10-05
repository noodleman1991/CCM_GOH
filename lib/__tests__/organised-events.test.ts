import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d), queryLive: vi.fn(), queryRaw: vi.fn(), createDocument: vi.fn(), updateDocument: vi.fn(), nowMinute: () => "2026-10-05T00:00:00.000Z" }));
import { listEventsOrganisedBy } from "@/lib/content/internal/payload/discovery";

beforeEach(() => { query.mockReset(); query.mockResolvedValue({ docs: [] }); });

describe("events a member organises", () => {
  it("are their own approved suggestions, card fields only", async () => {
    await listEventsOrganisedBy("u1");
    const d = query.mock.calls[0][0];
    expect(d.collection).toBe("events");
    expect(JSON.stringify(d.where)).toContain('"submittedBy":{"equals":"u1"}');
    expect(JSON.stringify(d.where)).toContain('"moderationStatus":{"equals":"approved"}');
    expect(d.select).not.toHaveProperty("body");
  });
});
