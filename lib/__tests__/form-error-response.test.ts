import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale }: { locale: string }) =>
    Object.assign((key: string, values?: Record<string, unknown>) => `${locale}:${key}${values ? JSON.stringify(values) : ""}`, {
      has: () => true,
    }),
}));

import { formErrorResponse, requestLocale } from "@/lib/api/form-error";
import { readFormError } from "@/lib/forms/read-form-error";
import { ERROR_KEYS } from "@/lib/validation/error-keys";

const req = (headers: Record<string, string> = {}) => new Request("http://x/api", { headers });

describe("requestLocale", () => {
  it("prefers x-locale, then the NEXT_LOCALE cookie, then English", () => {
    expect(requestLocale(req({ "x-locale": "ar" }))).toBe("ar");
    expect(requestLocale(req({ cookie: "a=1; NEXT_LOCALE=fr" }))).toBe("fr");
    expect(requestLocale(req({ "x-locale": "de" }))).toBe("en");
  });
});

describe("formErrorResponse", () => {
  it("answers with a form sentence and one sentence per field, in the reader's language", async () => {
    const schema = z.object({ title: z.string().min(5, ERROR_KEYS.titleTooShort) });
    const parsed = schema.safeParse({ title: "ab" });
    if (parsed.success) throw new Error("expected failure");
    const res = await formErrorResponse({ request: req({ "x-locale": "es" }), issues: parsed.error, input: { title: "ab" } });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: { message: "es:form.fixBelow", fields: { title: 'es:title.tooShort{"min":5,"count":2}' } },
    });
  });

  it("can answer with only a form-level sentence", async () => {
    const res = await formErrorResponse({ request: req(), formKey: ERROR_KEYS.formRateLimited, status: 429 });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toEqual({ message: "en:form.rateLimited", fields: {} });
  });
});

describe("readFormError", () => {
  it("reads the shared shape", async () => {
    const res = new Response(JSON.stringify({ error: { message: "Fix", fields: { title: "Add a title" } } }), { status: 400 });
    expect(await readFormError(res, "fallback")).toEqual({ message: "Fix", fields: { title: "Add a title" } });
  });

  it("unknown server paths fall back to the form message", async () => {
    const res = new Response(JSON.stringify({ error: "Invalid file type" }), { status: 400 });
    expect(await readFormError(res, "Something went wrong")).toEqual({ message: "Something went wrong", fields: {} });
  });

  it("survives a body that is not JSON", async () => {
    expect(await readFormError(new Response("<html>", { status: 502 }), "Try again")).toEqual({ message: "Try again", fields: {} });
  });
});
