import { describe, expect, it } from "vitest";
import config from "@/payload.config";

/**
 * `@payloadcms/db-postgres` pushes drizzle's schema whenever
 * `NODE_ENV !== "production" && PAYLOAD_MIGRATING !== "true" && push !== false`
 * (`dist/connect.js`). All three hold during `pnpm dev` and during every
 * import script, so an unset `push` lets an ordinary dev server rewrite the
 * schema of a database holding real content — here, 21 in-flight moderation
 * drafts. It has fired before: `payload_migrations` still carries drizzle's
 * `{name:"dev",batch:"-1"}` marker.
 *
 * `push` is captured in the adapter's closure rather than exposed on the
 * resolved config, so this instantiates the adapter to read the value the
 * connect path will actually see.
 */
describe("the Payload Postgres adapter", () => {
  it("never auto-pushes schema", async () => {
    const resolved = await config;
    const adapter = resolved.db.init({
      payload: { config: resolved, logger: console },
    } as never) as unknown as { push?: boolean };

    expect(adapter.push).toBe(false);
  });
});
