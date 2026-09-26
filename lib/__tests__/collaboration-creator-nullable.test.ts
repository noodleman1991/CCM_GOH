import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `Collaboration.createdBy` cascaded: deleting the creator's user row deleted
 * every workspace they had created, with every other member's threads,
 * files, plans and docs. The erasure helper hands ownership to the oldest
 * remaining member first, so the cascade only bit on the raw delete paths
 * (the Clerk webhook until Slice 5) — but a foreign key that can delete a
 * team's work on one row removal is the wrong default regardless of which
 * code path reaches it. The creator becomes nullable and the constraint
 * becomes SET NULL; the handoff also records the heir as creator so the
 * "lead" shown on the public project page stays a real person.
 */
const root = path.resolve(__dirname, "../..");

describe("Collaboration.createdBy no longer cascades", () => {
  const schema = readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
  const model = schema.slice(schema.indexOf("model Collaboration {"), schema.indexOf("model CollaborationMember {"));

  it("the creator column is optional", () => {
    expect(model).toMatch(/createdById\s+String\?/);
  });

  it("the relation sets null on delete", () => {
    expect(model).toMatch(/createdBy\s+User\?\s+@relation\("CollaborationCreator"[^\n]*onDelete: SetNull/);
  });

  it("ships as a migration, not a schema-only change", () => {
    const dir = path.join(root, "prisma/migrations");
    const folder = readdirSync(dir).find((d) => d.includes("collaboration_creator_set_null"));
    expect(folder, "migration folder").toBeDefined();
    const sql = readFileSync(path.join(dir, folder!, "migration.sql"), "utf8");
    expect(sql).toMatch(/ALTER COLUMN "createdById" DROP NOT NULL/);
    expect(sql).toMatch(/ON DELETE SET NULL/);
    expect(existsSync(path.join(dir, folder!, "migration.sql"))).toBe(true);
  });
});
