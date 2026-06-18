import { NextResponse } from "next/server";
import { checkDBHealth } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Readiness/liveness probe. Returns 200 when the app + database are reachable,
 * 503 otherwise. No auth, no PII — safe for uptime monitors and load balancers.
 */
export async function GET() {
  const started = Date.now();
  let db = false;
  try {
    db = await checkDBHealth();
  } catch {
    db = false;
  }

  const ok = db;
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks: { database: db },
      uptimeMs: Date.now() - started,
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
