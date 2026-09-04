import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { migrations } from "@/migrations";
import config from "@/payload.config";

/**
 * The migration set the deployed application carries.
 *
 * `migrations/index.ts` is generated as a side effect of `payload
 * migrate:create`, and until the final review nothing imported it: the adapter
 * set neither `prodMigrations` nor `migrationDir`, so the barrel existed only
 * to look wired. The CLI reads the directory off disk, which is fine locally
 * and in CI but not on Vercel, where the source tree is not deployed — a
 * production boot would find no migrations, start cleanly, and fail at the
 * first query.
 *
 * Two ways that can silently come back, both asserted here: the barrel being
 * empty, and the barrel drifting from the files on disk (a hand-added
 * migration file, or a `migrate:create` whose regenerated index was not
 * committed).
 */

const MIGRATION_DIR = path.resolve(import.meta.dirname, "../../migrations");

function migrationFileNames(): string[] {
  return readdirSync(MIGRATION_DIR)
    .filter((name) => name.endsWith(".ts") && name !== "index.ts")
    .map((name) => name.replace(/\.ts$/, ""))
    .sort();
}

describe("the committed migration set", () => {
  it("is non-empty", () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  it("matches the files on disk, name for name", () => {
    expect(migrations.map((m) => m.name).sort()).toEqual(migrationFileNames());
  });

  it("exposes a runnable up and down for each", () => {
    for (const migration of migrations) {
      expect(typeof migration.up, migration.name).toBe("function");
      expect(typeof migration.down, migration.name).toBe("function");
    }
  });

  it("is the set the adapter carries into production", async () => {
    const resolved = await config;
    // `prodMigrations` and `migrationDir` are captured in the adapter's
    // closure, so read them off an initialised adapter rather than the
    // serialised config — the same technique payload-no-auto-push.test.ts uses
    // for `push`.
    const adapter = resolved.db.init({
      payload: { config: resolved, logger: console },
    } as never) as unknown as {
      prodMigrations?: { name: string }[];
      migrationDir?: string;
    };

    expect(adapter.prodMigrations?.map((m) => m.name).sort()).toEqual(migrationFileNames());
    expect(adapter.migrationDir).toBe(MIGRATION_DIR);
  });
});
