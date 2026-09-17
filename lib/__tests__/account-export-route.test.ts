/**
 * `GET /api/account/export` (Low list): fifteen Prisma reads per call with no
 * limit. `rateLimitRequest('account:export', 3/hour)` per user. The limiter is
 * real and runs on its in-process bucket (the prisma mock's `$queryRaw` throws).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn<() => Promise<{ userId: string | null }>>();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));

const modelCalls = vi.fn();
vi.mock("@/lib/prisma", () => {
  const model = new Proxy(
    {},
    {
      get: (_t, op: string) => async () => {
        modelCalls(op);
        return op === "findUnique" ? null : [];
      },
    }
  );
  const prisma = new Proxy(
    {},
    {
      get: (_t, name: string) => {
        if (name === "$queryRaw") {
          return async () => {
            throw new Error("no database in tests");
          };
        }
        return model;
      },
    }
  );
  return { prisma };
});

import { GET } from "@/app/api/account/export/route";

const req = () => new NextRequest("http://localhost/api/account/export");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/account/export", () => {
  it("serves the export as a JSON attachment", async () => {
    authMock.mockResolvedValue({ userId: "user_export_ok" });
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(modelCalls).toHaveBeenCalled();
  });

  it("returns 429 on the 4th export within the hour for one user", async () => {
    authMock.mockResolvedValue({ userId: "user_export_flood" });
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) statuses.push((await GET(req())).status);
    expect(statuses).toEqual([200, 200, 200, 429]);
    const fourth = await GET(req());
    expect(fourth.status).toBe(429);
    expect(fourth.headers.get("retry-after")).toBeTruthy();
  });

  it("still requires sign-in", async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await GET(req())).status).toBe(401);
    expect(modelCalls).not.toHaveBeenCalled();
  });
});
