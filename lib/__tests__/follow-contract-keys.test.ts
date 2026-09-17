import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import ar from "@/messages/ar.json";

/**
 * `components/follow/follow-button.tsx` titles itself with
 * `t(\`contract.${targetType}\`)` for whichever `FollowTargetType` it renders.
 * The 2026-09-16 audit found `follow.contract.USER` missing in every locale,
 * so following a person showed a raw key. The enum is the source of truth:
 * read it from the Prisma schema so a new target type fails here before it
 * ships without copy.
 */

const schema = readFileSync(fileURLToPath(new URL("../../prisma/schema.prisma", import.meta.url)), "utf8");
const enumBody = /enum FollowTargetType \{([^}]*)\}/.exec(schema)?.[1] ?? "";
const targetTypes = enumBody
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("//"));

type Messages = { follow?: { contract?: Record<string, unknown> } };
const locales: Record<string, Messages> = { en, es, fr, ar };

describe("follow.contract.<FollowTargetType> exists for every target the follow button can render", () => {
  it("reads the enum from the Prisma schema", () => {
    expect(targetTypes).toEqual(expect.arrayContaining(["REGION", "THEME", "PROJECT", "USER"]));
  });

  for (const [name, messages] of Object.entries(locales)) {
    it.each(targetTypes)(`${name}.json has a non-empty follow.contract.%s`, (type) => {
      const contract = messages.follow?.contract ?? {};
      expect(typeof contract[type], `${name}: follow.contract.${type}`).toBe("string");
      expect(String(contract[type]).trim()).not.toBe("");
    });
  }
});
