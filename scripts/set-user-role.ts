/**
 * Set a user's global role.
 *
 * The in-hub "Report a problem" bubble, the moderation queue, and the
 * CMS-writing sync actions are all gated on `isStaff` (lib/authz-core.ts), i.e.
 * role ∈ {team_editor, admin}. There is no separate allowlist — granting
 * someone the bubble means giving them a staff role here.
 *
 * A user row only exists after that person has signed in at least once (Clerk
 * sync creates it). If the email is not found, they have not signed in yet;
 * have them sign in, then re-run this.
 *
 * Usage:
 *   pnpm user:role -- --email=someone@example.org                        # dry-run, shows current role
 *   pnpm user:role -- --email=someone@example.org --role=team_editor --execute
 *   pnpm user:role -- --list                                             # show current staff
 *
 * Env: DATABASE_URL from .env.local (ep-lucky-waterfall — the database the app
 * actually runs against). Override the file with --env=.env.
 */

import { PrismaClient, type Role } from "../generated/prisma/index.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

const ENV_FILE = arg("env") || ".env.local";
const EMAIL = arg("email");
const ROLE = (arg("role") || "team_editor") as Role;
const EXECUTE = args.includes("--execute");
const LIST = args.includes("--list");

dotenv.config({ path: join(__dirname, "..", ENV_FILE), override: true });

const VALID_ROLES: Role[] = ["community_member", "community_editor", "team_editor", "admin"];
if (!VALID_ROLES.includes(ROLE)) {
  console.error(`Unknown --role=${ROLE}. Use one of: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}
if (!EMAIL && !LIST) {
  console.error("Pass --email=<address> (or --list to see current staff).");
  process.exit(1);
}

const host = (process.env.DATABASE_URL || "").match(/@([^/]*)\//)?.[1] ?? "?";
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const showStaff = async () => {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["team_editor", "admin"] } },
    select: { email: true, role: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });
  console.log(`\nStaff (${staff.length}) — these are the accounts that see the report-a-problem bubble:`);
  for (const s of staff) console.log(`  ${String(s.role).padEnd(12)} ${s.email}`);
};

console.log(`${ENV_FILE} | ${host} | ${EXECUTE ? "EXECUTE" : "dry-run"}`);

if (LIST) {
  await showStaff();
  await prisma.$disconnect();
  process.exit(0);
}

const user = await prisma.user.findUnique({
  where: { email: EMAIL },
  select: { id: true, email: true, role: true, firstName: true, lastName: true },
});

if (!user) {
  console.error(`\n✗ No user with email ${EMAIL}.`);
  console.error("  A row is only created once that person signs in (Clerk sync).");
  console.error("  Have them sign in at least once, then re-run this command.");
  await showStaff();
  await prisma.$disconnect();
  process.exit(1);
}

const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "(no name)";
console.log(`\n${user.email} — ${name}`);
console.log(`  role: ${user.role} -> ${ROLE}${user.role === ROLE ? "  (already set, nothing to do)" : ""}`);

if (EXECUTE && user.role !== ROLE) {
  await prisma.user.update({ where: { id: user.id }, data: { role: ROLE } });
  console.log("  ✅ updated");
} else if (!EXECUTE) {
  console.log("\nRe-run with --execute to apply.");
}

await showStaff();
await prisma.$disconnect();
