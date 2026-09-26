/**
 * The production runbook, steps 1 to 6, as one re-runnable command
 * (docs/migration/payload-production-runbook.md). Everything up to, but not
 * including, the cutover: it never sets CONTENT_BACKEND in production and
 * never deploys.
 *
 *   pnpm prod:prepare                         # all steps, in order
 *   pnpm prod:prepare -- --only=db,env        # a subset
 *   pnpm prod:prepare -- --only=import --allow-after-drafts   # re-import from a newer archive
 *   pnpm prod:prepare -- --admins=a@x.org --editors=b@x.org,c@x.org   # also set roles
 *
 * Steps (each idempotent; a re-run skips what is already done):
 *   db       create the `payload_cms` database on the production Neon branch
 *   env      push the production variables from `.env` to Vercel (production
 *            and preview), skipping any that exist; preview also gets the two
 *            CONTENT_BACKEND switches set to `payload`
 *   migrate  Payload migrations against the production Payload database
 *   import   assets, documents, drafts from the newest Sanity archive, then
 *            verify and the read-only order check
 *   prisma   `prisma migrate deploy` against the production hub database
 *   search   push the Algolia index settings to the live indices
 *   roles    (only with --admins/--editors) set staff roles in production
 *
 * Every value comes from `.env`, the production env file, loaded here and
 * handed to each child explicitly. That matters for the Payload CLI, which
 * otherwise reads `.env.local` (Next's loader) and would migrate the dev
 * database; an explicit variable wins over any file. The import scripts keep
 * their own `--allow-production` guard on top.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse as parseDotenv } from "dotenv";

const args = process.argv.slice(2);
const arg = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const only = arg("only")?.split(",").map((s) => s.trim()).filter(Boolean);
const ALL_STEPS = ["db", "env", "migrate", "import", "prisma", "search", "roles"] as const;
type Step = (typeof ALL_STEPS)[number];

const prodEnv = parseDotenv(readFileSync(".env", "utf8"));
const env: NodeJS.ProcessEnv = { ...process.env, ...prodEnv, NODE_ENV: "production" };

/** Variables the runbook's table names, pushed when `.env` has them. */
const VERCEL_VARS = [
  "PAYLOAD_DATABASE_URL",
  "PAYLOAD_SECRET",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "PAYLOAD_R2_BUCKET",
  "NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL",
  "INTERNAL_SYNC_SECRET",
  "CASE_STUDY_EMAIL_FROM",
  "RESEND_AUDIENCE_ID",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

function heading(title: string) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`);
}

function run(cmd: string, cmdArgs: string[], opts: { input?: string; extraEnv?: NodeJS.ProcessEnv } = {}) {
  console.log(`$ ${cmd} ${cmdArgs.join(" ")}`);
  const r = spawnSync(cmd, cmdArgs, { stdio: opts.input ? ["pipe", "inherit", "inherit"] : "inherit", env: { ...env, ...opts.extraEnv }, input: opts.input });
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs[0] ?? ""} exited with ${r.status}`);
}

function capture(cmd: string, cmdArgs: string[]): string {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8", env });
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
}

function hostOf(url: string | undefined): string {
  try {
    return url ? new URL(url).host : "(unset)";
  } catch {
    return "(unparseable)";
  }
}

const steps: Record<Step, () => Promise<void> | void> = {
  async db() {
    heading("db: payload_cms on the production branch");
    const { PrismaClient } = await import("@/generated/prisma");
    const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
    const rows = await prisma.$queryRawUnsafe<Array<{ datname: string }>>("select datname from pg_database where datname = 'payload_cms'");
    if (rows.length > 0) {
      console.log("payload_cms already exists on", hostOf(env.DATABASE_URL));
    } else {
      await prisma.$executeRawUnsafe("create database payload_cms");
      console.log("created payload_cms on", hostOf(env.DATABASE_URL));
    }
    await prisma.$disconnect();
    if (hostOf(env.PAYLOAD_DATABASE_URL) !== hostOf(env.DATABASE_URL)) {
      throw new Error(`PAYLOAD_DATABASE_URL in .env points at ${hostOf(env.PAYLOAD_DATABASE_URL)}, not the production host ${hostOf(env.DATABASE_URL)}`);
    }
  },

  env() {
    heading("env: Vercel production and preview variables");
    for (const target of ["production", "preview"] as const) {
      const listing = capture("vercel", ["env", "ls", target]);
      const has = (name: string) => new RegExp(`(^|\\s)${name}(\\s|$)`, "m").test(listing);
      const wanted: Array<[string, string]> = VERCEL_VARS.filter((n) => prodEnv[n]).map((n) => [n, prodEnv[n]]);
      if (target === "preview") wanted.push(["CONTENT_BACKEND", "payload"], ["NEXT_PUBLIC_CONTENT_BACKEND", "payload"]);
      for (const [name, value] of wanted) {
        if (has(name)) {
          console.log(`  ${target} ${name}: already set, left as is`);
          continue;
        }
        run("vercel", ["env", "add", name, target], { input: value });
        console.log(`  ${target} ${name}: added`);
      }
    }
    const missing = ["CASE_STUDY_EMAIL_FROM", "NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_SENTRY_DSN", "UPSTASH_REDIS_REST_URL"].filter((n) => !prodEnv[n]);
    if (missing.length) console.log(`  not in .env, so not pushed (optional or needs a third-party account): ${missing.join(", ")}`);
  },

  migrate() {
    heading(`migrate: Payload schema on ${hostOf(env.PAYLOAD_DATABASE_URL)}`);
    run("pnpm", ["exec", "payload", "migrate"], { input: "y\n" });
    run("pnpm", ["exec", "payload", "migrate:status"]);
  },

  import() {
    heading(`import: Sanity archive into ${hostOf(env.PAYLOAD_DATABASE_URL)} and bucket ${env.PAYLOAD_R2_BUCKET ?? env.R2_BUCKET}`);
    run("pnpm", ["import:assets", "--", "--allow-production"]);
    // `--allow-after-drafts` re-applies the published documents after a draft
    // import (an upsert; the drafts step right after re-applies the drafts).
    // Needed when the archive changed between two runs.
    const afterDrafts = args.includes("--allow-after-drafts") ? ["--allow-after-drafts"] : [];
    run("pnpm", ["import:documents", "--", "--allow-production", ...afterDrafts]);
    run("pnpm", ["import:drafts", "--", "--allow-production"]);
    run("pnpm", ["verify:import", "--", "--allow-production"]);
    run("pnpm", ["tsx", "scripts/parity/order-check.ts", "--allow-production"]);
  },

  prisma() {
    heading(`prisma: migrate deploy on ${hostOf(env.DATABASE_URL)}`);
    run("pnpm", ["exec", "prisma", "migrate", "deploy"]);
  },

  search() {
    heading("search: Algolia index settings on the live indices");
    run("pnpm", ["tsx", "scripts/algolia/push-index-settings.ts", "--allow-production"]);
  },

  roles() {
    const admins = arg("admins")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
    const editors = arg("editors")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
    if (admins.length + editors.length === 0) {
      console.log("\nroles: skipped (pass --admins= and/or --editors= to set staff roles in production)");
      return;
    }
    heading("roles: staff accounts in the production hub database");
    for (const email of admins) run("pnpm", ["user:role", "--", `--email=${email}`, "--role=admin", "--execute", "--env=.env"]);
    for (const email of editors) run("pnpm", ["user:role", "--", `--email=${email}`, "--role=team_editor", "--execute", "--env=.env"]);
    run("pnpm", ["user:role", "--", "--list", "--env=.env"]);
  },
};

async function main() {
  const chosen: Step[] = (only?.length ? only : [...ALL_STEPS]).filter((s): s is Step => (ALL_STEPS as readonly string[]).includes(s));
  const unknown = (only ?? []).filter((s) => !(ALL_STEPS as readonly string[]).includes(s));
  if (unknown.length) {
    console.error(`unknown step(s): ${unknown.join(", ")}; known: ${ALL_STEPS.join(", ")}`);
    process.exit(2);
  }
  for (const name of ["DATABASE_URL", "PAYLOAD_DATABASE_URL", "PAYLOAD_SECRET", "R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "PAYLOAD_R2_BUCKET"]) {
    if (!prodEnv[name]) {
      console.error(`.env is missing ${name}; the runbook's step 0 to 2 explain where it comes from`);
      process.exit(2);
    }
  }
  console.log(`production hub database: ${hostOf(env.DATABASE_URL)}`);
  console.log(`production Payload database: ${hostOf(env.PAYLOAD_DATABASE_URL)} / ${new URL(env.PAYLOAD_DATABASE_URL!).pathname.slice(1)}`);
  console.log(`steps: ${chosen.join(", ")}`);
  for (const step of chosen) await steps[step]();
  console.log(`
Done. What remains is the runbook's step 5 and 7, by hand:
  vercel                              # preview deploy; walk /en and /ar, /dashboard, /admin
  vercel env add CONTENT_BACKEND production          (value: payload)
  vercel env add NEXT_PUBLIC_CONTENT_BACKEND production
  vercel --prod                       # editorial freeze first; redo the export + import if it is stale
  then rebuild the four live search indices (runbook step 6) and open /admin as an editor.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
