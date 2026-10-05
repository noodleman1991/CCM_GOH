/**
 * How collaboration is being used — read only (opening-collaboration spec §4).
 *
 *   pnpm exec tsx scripts/collaboration/uptake.ts                               # dev
 *   scripts/with-prod-env.sh pnpm exec tsx scripts/collaboration/uptake.ts --production
 *
 * Prints the Settings → Collaboration values and counts: members and how many
 * are open to collaborate, connection requests by status (last 7 days / all),
 * notifications created and read in the last 7 days by type, region follows,
 * workspaces. Nothing is written.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const WEEK = 7 * 24 * 60 * 60 * 1000;

async function main() {
  const production = process.argv.includes("--production");
  const { assertPayloadDatabase, getPayloadInstance, loadEnv } = await import("../payload-import/lib/runtime");
  await loadEnv();
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, { action: "read collaboration settings", ...(production ? { allowProduction: true } : {}) });

  // The members database: dev's from .env.local, production's from .env — and
  // never the wrong one for the flag given.
  if (production) {
    const { default: dotenv } = await import("dotenv");
    process.env.DATABASE_URL = dotenv.parse(readFileSync(path.resolve(process.cwd(), ".env"), "utf8")).DATABASE_URL;
  }
  const host = (process.env.DATABASE_URL ?? "").replace(/^[a-z]+:\/\/[^@]*@([^/:?]+).*$/, "$1");
  if (production !== host.includes("misty-dawn")) {
    console.log(`Refusing: members database "${host}" doesn't match ${production ? "--production" : "dev"}.`);
    process.exit(1);
  }
  console.log(`Members database: ${host}${production ? " (PRODUCTION, read only)" : ""}\n`);

  const payload = await getPayloadInstance();
  const settings = (await payload.findGlobal({ slug: "collaborationSettings", depth: 0 })) as unknown as Record<string, unknown>;
  console.log("Settings → Collaboration:", JSON.stringify({ notifications: settings.notifications, people: settings.people, workspaces: settings.workspaces, messages: settings.messages, contributions: settings.contributions }));

  const { prisma } = await import("../../lib/prisma");
  const since = new Date(Date.now() - WEEK);
  const [members, open, requestsAll, requestsWeek, notesWeek, readWeek, follows, workspaces] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { openToCollaboration: true } }),
    prisma.contactRequest.groupBy({ by: ["status"], _count: true }),
    prisma.contactRequest.groupBy({ by: ["status"], _count: true, where: { createdAt: { gte: since } } }),
    prisma.notification.groupBy({ by: ["type"], _count: true, where: { createdAt: { gte: since } } }),
    prisma.notification.groupBy({ by: ["type"], _count: true, where: { createdAt: { gte: since }, readAt: { not: null } } }),
    prisma.follow.count({ where: { targetType: "REGION" } }),
    prisma.collaboration.count({ where: { status: "ACTIVE" } }),
  ]);
  const byKey = <T extends { _count: number }>(rows: T[], key: keyof T) => Object.fromEntries(rows.map((r) => [String(r[key]), r._count]));

  console.log(`\nMembers: ${members} · open to collaborate: ${open} (${members ? Math.round((100 * open) / members) : 0}%)`);
  console.log("Connection requests — all:", JSON.stringify(byKey(requestsAll, "status")), "· last 7 days:", JSON.stringify(byKey(requestsWeek, "status")));
  console.log("Notifications, last 7 days — created:", JSON.stringify(byKey(notesWeek, "type")), "· read:", JSON.stringify(byKey(readWeek, "type")));
  console.log(`Region follows: ${follows} · active workspaces: ${workspaces}`);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
