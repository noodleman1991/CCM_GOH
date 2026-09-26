import { describe, expect, it } from "vitest";
import { ERROR_KEYS } from "@/lib/validation/error-keys";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import ar from "@/messages/ar.json";

const lookup = (messages: unknown, key: string) =>
  key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], (messages as { forms: { errors: unknown } }).forms.errors);

describe("form error messages", () => {
  it.each([["en", en], ["es", es], ["fr", fr], ["ar", ar]] as const)("every key exists in %s", (_, messages) => {
    const missing = Object.values(ERROR_KEYS).filter((key) => typeof lookup(messages, key) !== "string");
    expect(missing).toEqual([]);
  });

  it("no English message uses developer words", () => {
    const text = JSON.stringify((en as { forms: { errors: unknown } }).forms.errors).toLowerCase();
    for (const word of ["invalid", "validation", "schema", "string must", "required field", "null"]) {
      expect(text).not.toContain(word);
    }
  });
});
