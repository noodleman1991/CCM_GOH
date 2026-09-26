# Human-friendly forms (projects 1 + 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One shared, plain-language validation and error system, and the case study submission form rebuilt on it: clear errors, drafts that never lose anything, markdown that works, tags instead of Topic, location by search only, and writing in any of the four languages.

**Architecture:** Each form has one zod rule set (in `lib/validation/`) whose messages are *keys*, shared by the browser and the API route. A tiny translation layer turns zod issues into sentences on either side. API routes answer rejections in one shape (`{ error: { message, fields } }`). A client hook (`useFormErrors`) plus two components (`FieldError`, `WhatsLeft`) give every form the same behaviour. The case study form is split out of its 1,164-line file into section components that use them. Data changes go through Payload migrations and guarded dry-run scripts.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl 4, zod 3.25, TipTap 3, Payload 3.88 (Postgres), vitest (+ jsdom + @testing-library/react), Tailwind/shadcn.

**Spec:** `docs/superpowers/specs/2026-09-26-human-friendly-forms-design.md`. Read it before starting. It is the source of truth for wording, rules and scope.

## Global Constraints

- Commits: `type(scope): sentence` (see `git log`). **Never add any Claude/AI co-author or attribution line** (CLAUDE.md).
- Every user-facing string lives in `messages/{en,es,fr,ar}.json`, all four languages, plain words, never dev-speak (no "schema", "validation failed", "invalid", field paths).
- Validation minimums (spec §5.2): title ≥ 5 chars; summary ≥ 50; when not writing in English: English title ≥ 5 and English summary ≥ 20; story has ≥ 1 paragraph of text; ≥ 1 author with a name; ≥ 1 tag whose category is `topic`; a place **or** a regional community.
- A draft requires nothing.
- Tests live in `lib/__tests__/`. Component tests start with `// @vitest-environment jsdom`. Run one file with `npx vitest run <path>`, all with `npx vitest run`.
- Lint only the files you changed: `npx eslint <files>`. The repo-wide lint has pre-existing errors; don't try to fix them.
- Type check: `npx tsc --noEmit -p .` must print nothing.
- Never run `sanity typegen generate`.
- Anything under `payload/**` that the admin imports as a client component must import only pure modules (no `lib/content`, no `next/headers`). After touching `payload/**`, start `pnpm dev` and confirm `curl -s -o /dev/null -w "%{http_code}" localhost:3000/admin` prints 200.
- Dev-database writes only through `scripts/payload-import/lib/runtime.ts` (`loadEnv`, `assertPayloadDatabase`, `getPayloadInstance`, `IMPORT_WRITE_CONTEXT`). Throwaway scripts go in `scripts/` and are deleted after use.
- **Production DB, production deploys and production data scripts are never run by the agent.** They're handed to the user (runbook: `docs/migration/payload-production-runbook.md`).
- Design language: reuse existing tokens/components (`ccm-*` colours, shadcn `Button`/`Input`/`Drawer`, `CharCounter`, `FilterChip`, `SearchInput`); mobile-first; RTL correct (`dir` from the writing language); tap targets `min-h-11`.
- Field element ids follow `fieldId(path)` (Task 3): `field-` + path with dots replaced by dashes (`title.en` → `field-title-en`).

## Review Focus

1. **Arabic writer on the English site:** title, summary and story render right-to-left and the English title/summary become required. Pinned in Task 14, test "arabic writing language".
2. **Reopening a draft written in another language** restores the writing language and all fields including place and cover image. Pinned in Task 12, test "draft round-trip keeps language, place and image".
3. **A server error for a field the form doesn't render** (unknown path) is never lost; it appears as the form-level message. Pinned in Task 3, test "unknown server paths fall back to the form message".
4. **Place search finds nothing or the geocoder is down:** the user can still meet the location rule with a community, and the hint tells them how. Pinned in Task 9, test "no results shows the country/region hint", and Task 5, test "community alone satisfies location".
5. **Pasted prose containing `#` or `*` mid-sentence** (for example "we met #3 times", "5 * 3") is not turned into headings or lists. Pinned in Task 11, test "prose with symbols stays prose".

---

# Phase 1: Shared error system (project 1)

### Task 1: Error messages in four languages

**Files:**
- Modify: `messages/en.json`, `messages/es.json`, `messages/fr.json`, `messages/ar.json` (add `forms.errors`, keeping the existing `forms` keys)
- Create: `lib/validation/error-keys.ts`
- Test: `lib/__tests__/form-error-messages.test.ts`

**Interfaces:**
- Produces: `ERROR_KEYS` (object of key strings, relative to the `forms.errors` namespace) and `type ErrorKey`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/form-error-messages.test.ts
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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/form-error-messages.test.ts`
Expected: FAIL, because `@/lib/validation/error-keys` can't be resolved.

- [ ] **Step 3: Create the keys**

```ts
// lib/validation/error-keys.ts
/** Message keys under `forms.errors` in messages/*.json. Schemas use these as zod messages. */
export const ERROR_KEYS = {
  titleRequired: "title.required",
  titleTooShort: "title.tooShort",
  summaryRequired: "summary.required",
  summaryTooShort: "summary.tooShort",
  englishTitleRequired: "englishTitle.required",
  englishSummaryTooShort: "englishSummary.tooShort",
  storyRequired: "story.required",
  authorsRequired: "authors.required",
  authorNameRequired: "author.nameRequired",
  authorEmail: "author.email",
  themeRequired: "tags.themeRequired",
  locationRequired: "location.required",
  endBeforeStart: "dates.endBeforeStart",
  tooLong: "generic.tooLong",
  uploadTooBig: "upload.tooBig",
  uploadWrongType: "upload.wrongType",
  formFixBelow: "form.fixBelow",
  formGeneric: "form.generic",
  formRateLimited: "form.rateLimited",
  formNotAllowed: "form.notAllowed",
  formSignIn: "form.signIn",
} as const;

export type ErrorKey = (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS];
```

- [ ] **Step 4: Add the messages**

In each `messages/<locale>.json`, inside the existing `"forms": { … }` object, add an `"errors"` object. Use exactly:

`en`:
```json
"errors": {
  "title": { "required": "Add a title so readers know what this is about", "tooShort": "Make the title a little longer (at least {min} characters)" },
  "summary": { "required": "Write a short summary of what happened", "tooShort": "Write at least {min} characters so readers know what to expect ({count} so far)" },
  "englishTitle": { "required": "Add a short English title so the English site can list this" },
  "englishSummary": { "tooShort": "Add a one-line English summary (at least {min} characters)" },
  "story": { "required": "Write your story — at least a paragraph" },
  "authors": { "required": "Add who wrote this" },
  "author": { "nameRequired": "Add this person's name", "email": "This email doesn't look right — check for typos" },
  "tags": { "themeRequired": "Choose at least one theme" },
  "location": { "required": "Add where this took place — search for a place, or choose a regional community" },
  "dates": { "endBeforeStart": "The end date is before the start date" },
  "generic": { "tooLong": "Keep this under {max} characters (it's {count} now)" },
  "upload": { "tooBig": "This image is {size} MB — the limit is {max} MB. Try a smaller photo or a screenshot.", "wrongType": "Use a JPEG, PNG or WebP image." },
  "form": {
    "fixBelow": "Some details need fixing — they're marked below.",
    "generic": "Something went wrong on our side. Your work is saved — try again in a moment.",
    "rateLimited": "You've sent this a few times in a row. Wait a minute and try again.",
    "notAllowed": "You can't edit this any more — it may already be published.",
    "signIn": "Your session has ended. Sign in again to continue — your work is saved."
  }
}
```

`es`:
```json
"errors": {
  "title": { "required": "Añade un título para que se sepa de qué trata", "tooShort": "Alarga un poco el título (al menos {min} caracteres)" },
  "summary": { "required": "Escribe un breve resumen de lo que pasó", "tooShort": "Escribe al menos {min} caracteres para que se sepa qué esperar ({count} por ahora)" },
  "englishTitle": { "required": "Añade un título corto en inglés para que el sitio en inglés pueda mostrarlo" },
  "englishSummary": { "tooShort": "Añade un resumen de una línea en inglés (al menos {min} caracteres)" },
  "story": { "required": "Escribe tu historia: al menos un párrafo" },
  "authors": { "required": "Indica quién lo escribió" },
  "author": { "nameRequired": "Añade el nombre de esta persona", "email": "Este correo no parece correcto: revisa si hay errores" },
  "tags": { "themeRequired": "Elige al menos un tema" },
  "location": { "required": "Indica dónde ocurrió: busca un lugar o elige una comunidad regional" },
  "dates": { "endBeforeStart": "La fecha de fin es anterior a la de inicio" },
  "generic": { "tooLong": "No pases de {max} caracteres (ahora tiene {count})" },
  "upload": { "tooBig": "Esta imagen pesa {size} MB y el límite es {max} MB. Prueba con una foto más pequeña o una captura de pantalla.", "wrongType": "Usa una imagen JPEG, PNG o WebP." },
  "form": {
    "fixBelow": "Hay que corregir algunos datos: están marcados abajo.",
    "generic": "Algo falló por nuestra parte. Tu trabajo está guardado: vuelve a intentarlo en un momento.",
    "rateLimited": "Lo has enviado varias veces seguidas. Espera un minuto y vuelve a intentarlo.",
    "notAllowed": "Ya no puedes editar esto: puede que ya esté publicado.",
    "signIn": "Tu sesión ha terminado. Vuelve a iniciar sesión para continuar: tu trabajo está guardado."
  }
}
```

`fr`:
```json
"errors": {
  "title": { "required": "Ajoutez un titre pour que l'on sache de quoi il s'agit", "tooShort": "Allongez un peu le titre (au moins {min} caractères)" },
  "summary": { "required": "Écrivez un court résumé de ce qui s'est passé", "tooShort": "Écrivez au moins {min} caractères pour que l'on sache à quoi s'attendre ({count} pour l'instant)" },
  "englishTitle": { "required": "Ajoutez un court titre en anglais pour que le site anglais puisse l'afficher" },
  "englishSummary": { "tooShort": "Ajoutez un résumé d'une ligne en anglais (au moins {min} caractères)" },
  "story": { "required": "Écrivez votre récit : au moins un paragraphe" },
  "authors": { "required": "Indiquez qui l'a écrit" },
  "author": { "nameRequired": "Ajoutez le nom de cette personne", "email": "Cette adresse e-mail semble incorrecte : vérifiez les fautes de frappe" },
  "tags": { "themeRequired": "Choisissez au moins un thème" },
  "location": { "required": "Indiquez où cela s'est passé : cherchez un lieu ou choisissez une communauté régionale" },
  "dates": { "endBeforeStart": "La date de fin est antérieure à la date de début" },
  "generic": { "tooLong": "Restez sous {max} caractères (actuellement {count})" },
  "upload": { "tooBig": "Cette image fait {size} Mo, la limite est de {max} Mo. Essayez une photo plus légère ou une capture d'écran.", "wrongType": "Utilisez une image JPEG, PNG ou WebP." },
  "form": {
    "fixBelow": "Certains éléments sont à corriger : ils sont signalés ci-dessous.",
    "generic": "Un problème est survenu de notre côté. Votre travail est enregistré : réessayez dans un instant.",
    "rateLimited": "Vous l'avez envoyé plusieurs fois de suite. Attendez une minute et réessayez.",
    "notAllowed": "Vous ne pouvez plus modifier ceci : il est peut-être déjà publié.",
    "signIn": "Votre session a expiré. Reconnectez-vous pour continuer : votre travail est enregistré."
  }
}
```

`ar`:
```json
"errors": {
  "title": { "required": "أضف عنوانًا ليعرف القرّاء موضوعه", "tooShort": "اجعل العنوان أطول قليلًا ({min} أحرف على الأقل)" },
  "summary": { "required": "اكتب ملخصًا قصيرًا لما حدث", "tooShort": "اكتب {min} حرفًا على الأقل ليعرف القرّاء ما يتوقعونه ({count} حتى الآن)" },
  "englishTitle": { "required": "أضف عنوانًا قصيرًا بالإنجليزية ليظهر في الموقع الإنجليزي" },
  "englishSummary": { "tooShort": "أضف ملخصًا من سطر واحد بالإنجليزية ({min} حرفًا على الأقل)" },
  "story": { "required": "اكتب قصتك: فقرة واحدة على الأقل" },
  "authors": { "required": "أضف من كتب هذا" },
  "author": { "nameRequired": "أضف اسم هذا الشخص", "email": "يبدو أن هذا البريد غير صحيح، تحقّق من الأخطاء المطبعية" },
  "tags": { "themeRequired": "اختر موضوعًا واحدًا على الأقل" },
  "location": { "required": "أضف مكان حدوث ذلك: ابحث عن مكان أو اختر مجتمعًا إقليميًا" },
  "dates": { "endBeforeStart": "تاريخ الانتهاء يسبق تاريخ البدء" },
  "generic": { "tooLong": "لا تتجاوز {max} حرفًا (العدد الآن {count})" },
  "upload": { "tooBig": "حجم هذه الصورة {size} ميغابايت والحد {max} ميغابايت. جرّب صورة أصغر أو لقطة شاشة.", "wrongType": "استخدم صورة بصيغة JPEG أو PNG أو WebP." },
  "form": {
    "fixBelow": "بعض التفاصيل تحتاج إلى تصحيح، وهي موضّحة أدناه.",
    "generic": "حدث خطأ من جهتنا. عملك محفوظ، حاول مرة أخرى بعد قليل.",
    "rateLimited": "أرسلت هذا عدة مرات متتالية. انتظر دقيقة ثم حاول مرة أخرى.",
    "notAllowed": "لم يعد بإمكانك تعديل هذا، فربما نُشر بالفعل.",
    "signIn": "انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة، عملك محفوظ."
  }
}
```

Keep each file's existing 2-space indentation and key order. Only add the `errors` object.

- [ ] **Step 5: Run the test and confirm it passes**

Run: `npx vitest run lib/__tests__/form-error-messages.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/validation/error-keys.ts lib/__tests__/form-error-messages.test.ts messages/*.json
git commit -m "feat(forms): plain-language error messages in all four languages"
```

---

### Task 2: Zod issues → field sentences

**Files:**
- Create: `lib/validation/messages.ts`
- Test: `lib/__tests__/validation-messages.test.ts`

**Interfaces:**
- Consumes: `ERROR_KEYS` (Task 1).
- Produces:
  - `type FieldIssue = { path: string; key: string; values?: Record<string, string | number> }`
  - `type Translator = ((key: string, values?: Record<string, string | number>) => string) & { has?: (key: string) => boolean }`
  - `toFieldIssues(error: ZodError): FieldIssue[]`: first issue per path only.
  - `translateIssues(issues: FieldIssue[], t: Translator, input?: unknown): Record<string, string>`: adds `count` (string length or array length at that path in `input`) when absent; an unknown key becomes the `form.fixBelow` sentence.
  - `valueAt(input: unknown, path: string): unknown`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/validation-messages.test.ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toFieldIssues, translateIssues, valueAt } from "@/lib/validation/messages";
import { ERROR_KEYS } from "@/lib/validation/error-keys";

const t = Object.assign(
  (key: string, values?: Record<string, string | number>) => `${key}${values ? JSON.stringify(values) : ""}`,
  { has: (key: string) => !key.startsWith("zod:") },
);

describe("toFieldIssues", () => {
  it("keeps the first problem per field and carries min/max", () => {
    const schema = z.object({ title: z.string().min(5, ERROR_KEYS.titleTooShort).max(10, ERROR_KEYS.tooLong) });
    const result = schema.safeParse({ title: "abc" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldIssues(result.error)).toEqual([{ path: "title", key: "title.tooShort", values: { min: 5 } }]);
  });

  it("reads values from custom issues' params", () => {
    const schema = z.object({ a: z.string() }).superRefine((_, ctx) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["excerpt", "en"], message: ERROR_KEYS.englishSummaryTooShort, params: { min: 20 } }),
    );
    const result = schema.safeParse({ a: "x" });
    if (result.success) throw new Error("expected failure");
    expect(toFieldIssues(result.error)[0]).toEqual({ path: "excerpt.en", key: "englishSummary.tooShort", values: { min: 20 } });
  });
});

describe("translateIssues", () => {
  it("adds the current count for text and lists", () => {
    const sentences = translateIssues([{ path: "excerpt.ar", key: "summary.tooShort", values: { min: 50 } }], t, { excerpt: { ar: "قصير" } });
    expect(sentences["excerpt.ar"]).toBe('summary.tooShort{"min":50,"count":4}');
  });

  it("turns a message that is not one of our keys into the generic fix sentence", () => {
    const sentences = translateIssues([{ path: "x", key: "zod:Required" }], t);
    expect(sentences.x).toBe("form.fixBelow");
  });
});

describe("valueAt", () => {
  it("walks dotted paths including array indexes", () => {
    expect(valueAt({ authors: [{ name: "A" }, { name: "B" }] }, "authors.1.name")).toBe("B");
    expect(valueAt({}, "a.b")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/validation-messages.test.ts`
Expected: FAIL, because the module can't be resolved.

- [ ] **Step 3: Implement**

```ts
// lib/validation/messages.ts
import type { ZodError, ZodIssue } from "zod";
import { ERROR_KEYS } from "@/lib/validation/error-keys";

/**
 * Zod issues → plain sentences, shared by forms and API routes. Schemas carry
 * message KEYS (lib/validation/error-keys.ts); this turns them into sentences
 * with whichever translator the caller has (next-intl on either side).
 */

export type FieldIssue = { path: string; key: string; values?: Record<string, string | number> };
export type Translator = ((key: string, values?: Record<string, string | number>) => string) & {
  has?: (key: string) => boolean;
};

function issueValues(issue: ZodIssue): FieldIssue["values"] {
  if (issue.code === "too_small") return { min: Number(issue.minimum) };
  if (issue.code === "too_big") return { max: Number(issue.maximum) };
  if (issue.code === "custom" && issue.params) return issue.params as Record<string, string | number>;
  return undefined;
}

export function toFieldIssues(error: ZodError): FieldIssue[] {
  const seen = new Set<string>();
  const issues: FieldIssue[] = [];
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (seen.has(path)) continue;
    seen.add(path);
    const values = issueValues(issue);
    issues.push(values ? { path, key: issue.message, values } : { path, key: issue.message });
  }
  return issues;
}

export function valueAt(input: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((node, part) => (node == null ? undefined : (node as Record<string, unknown>)[part]), input);
}

export function translateIssues(issues: FieldIssue[], t: Translator, input?: unknown): Record<string, string> {
  const sentences: Record<string, string> = {};
  for (const issue of issues) {
    const known = t.has ? t.has(issue.key) : true;
    if (!known) {
      sentences[issue.path] = t(ERROR_KEYS.formFixBelow);
      continue;
    }
    const current = valueAt(input, issue.path);
    const count =
      typeof current === "string" ? current.length : Array.isArray(current) ? current.length : undefined;
    const values = { ...issue.values, ...(count !== undefined && issue.values?.count === undefined ? { count } : {}) };
    sentences[issue.path] = Object.keys(values).length > 0 ? t(issue.key, values) : t(issue.key);
  }
  return sentences;
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run lib/__tests__/validation-messages.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/validation/messages.ts lib/__tests__/validation-messages.test.ts
git commit -m "feat(forms): turn validation problems into sentences on either side"
```

---

### Task 3: One reply shape from the server, read the same way by every form

**Files:**
- Create: `lib/api/form-error.ts` (server)
- Create: `lib/forms/read-form-error.ts` (client-safe, pure)
- Test: `lib/__tests__/form-error-response.test.ts`

**Interfaces:**
- Consumes: `FieldIssue`, `toFieldIssues`, `translateIssues` (Task 2); `ERROR_KEYS` (Task 1).
- Produces:
  - `type FormErrorBody = { error: { message: string; fields: Record<string, string> } }`
  - `requestLocale(request: Request): "en" | "es" | "fr" | "ar"`: the `x-locale` header, else the `NEXT_LOCALE` cookie, else `"en"`.
  - `formErrorResponse(args: { request: Request; issues?: FieldIssue[] | ZodError; formKey?: ErrorKey; status?: number; input?: unknown; values?: Record<string, string | number> }): Promise<NextResponse<FormErrorBody>>`
  - `readFormError(response: Response, fallback: string): Promise<{ message: string; fields: Record<string, string> }>`
  - `localeHeaders(locale: string): Record<string, string>`, which returns `{ "x-locale": locale }`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/form-error-response.test.ts
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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/form-error-response.test.ts`
Expected: FAIL, because the modules can't be resolved.

- [ ] **Step 3: Implement the server helper**

```ts
// lib/api/form-error.ts
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod";
import { ERROR_KEYS, type ErrorKey } from "@/lib/validation/error-keys";
import { toFieldIssues, translateIssues, type FieldIssue } from "@/lib/validation/messages";

export type FormErrorBody = { error: { message: string; fields: Record<string, string> } };

const LOCALES = ["en", "es", "fr", "ar"] as const;
type Locale = (typeof LOCALES)[number];

const isLocale = (value: string | null | undefined): value is Locale => LOCALES.includes(value as Locale);

export function requestLocale(request: Request): Locale {
  const header = request.headers.get("x-locale");
  if (isLocale(header)) return header;
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
  return isLocale(cookie) ? cookie : "en";
}

/** Every rejected form submission answers in this one shape, in the reader's language. */
export async function formErrorResponse({
  request,
  issues,
  formKey = ERROR_KEYS.formFixBelow,
  status = 400,
  input,
  values,
}: {
  request: Request;
  issues?: FieldIssue[] | ZodError;
  formKey?: ErrorKey;
  status?: number;
  input?: unknown;
  values?: Record<string, string | number>;
}): Promise<NextResponse<FormErrorBody>> {
  const t = await getTranslations({ locale: requestLocale(request), namespace: "forms.errors" });
  const list = issues instanceof ZodError ? toFieldIssues(issues) : (issues ?? []);
  const fields = translateIssues(list, t as never, input);
  return NextResponse.json({ error: { message: values ? t(formKey, values) : t(formKey), fields } }, { status });
}
```

- [ ] **Step 4: Implement the client reader**

```ts
// lib/forms/read-form-error.ts
/** Reads a rejected form submission; anything unexpected becomes `fallback`, so a reason is never lost. */
export async function readFormError(
  response: Response,
  fallback: string,
): Promise<{ message: string; fields: Record<string, string> }> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: unknown; fields?: unknown } | unknown }
    | null;
  const error = body?.error;
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    const shaped = error as { message: string; fields?: unknown };
    const fields =
      shaped.fields && typeof shaped.fields === "object"
        ? Object.fromEntries(
            Object.entries(shaped.fields as Record<string, unknown>).filter(
              (entry): entry is [string, string] => typeof entry[1] === "string",
            ),
          )
        : {};
    return { message: shaped.message, fields };
  }
  return { message: fallback, fields: {} };
}

export function localeHeaders(locale: string): Record<string, string> {
  return { "x-locale": locale };
}
```

- [ ] **Step 5: Run it and confirm it passes**

Run: `npx vitest run lib/__tests__/form-error-response.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/api/form-error.ts lib/forms/read-form-error.ts lib/__tests__/form-error-response.test.ts
git commit -m "feat(forms): one error reply shape from the server, read the same way by every form"
```

---

### Task 4: `useFormErrors` and `FieldError`

**Files:**
- Create: `components/forms/errors/field-id.ts`
- Create: `components/forms/errors/use-form-errors.ts`
- Create: `components/forms/errors/field-error.tsx`
- Test: `lib/__tests__/use-form-errors.test.tsx`

**Interfaces:**
- Consumes: `FieldIssue`, `Translator`, `translateIssues` (Task 2).
- Produces:
  - `fieldId(path: string): string`, e.g. `"title.en"` → `"field-title-en"`
  - `errorId(path: string): string`, which returns `${fieldId(path)}-error`
  - `useFormErrors<T>(opts: { values: T; validate: (values: T) => FieldIssue[]; t: Translator; order: string[] })`, which returns:

```ts
{
  errors: Record<string, string>;            // what to show now
  leave: (path: string) => void;             // call on blur
  validateAll: () => boolean;                // call on Preview/Submit; true when clean
  setServerErrors: (fields: Record<string, string>) => void;
  focusFirstError: () => void;
  describedBy: (path: string) => { "aria-invalid"?: true; "aria-describedby"?: string };
}
```

  - `FieldError({ path, message }: { path: string; message?: string })`

Behaviour rules:
- An error for a path is shown only after that path has been left (`leave`), or after `validateAll`.
- On every value change, errors that are now fixed disappear immediately. New errors appear only on the next `leave` or `validateAll`.
- A server error for a path disappears as soon as that path's value changes.
- `focusFirstError` focuses the first path in `order` that has a visible error, via `document.getElementById(fieldId(path))`, and calls `scrollIntoView({ block: "center" })`.

- [ ] **Step 1: Write the failing test**

```tsx
// lib/__tests__/use-form-errors.test.tsx
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFormErrors } from "@/components/forms/errors/use-form-errors";
import { fieldId } from "@/components/forms/errors/field-id";
import type { FieldIssue } from "@/lib/validation/messages";

const t = (key: string) => key;
const validate = (v: { title: string; summary: string }): FieldIssue[] => [
  ...(v.title.length < 5 ? [{ path: "title", key: "title.tooShort" }] : []),
  ...(v.summary.length < 3 ? [{ path: "summary", key: "summary.tooShort" }] : []),
];

function setup(initial = { title: "", summary: "" }) {
  return renderHook(({ values }) => useFormErrors({ values, validate, t, order: ["title", "summary"] }), {
    initialProps: { values: initial },
  });
}

describe("useFormErrors", () => {
  it("shows nothing while typing, then the error once the field is left", () => {
    const { result, rerender } = setup();
    rerender({ values: { title: "ab", summary: "" } });
    expect(result.current.errors).toEqual({});
    act(() => result.current.leave("title"));
    expect(result.current.errors).toEqual({ title: "title.tooShort" });
  });

  it("clears an error the moment it is fixed", () => {
    const { result, rerender } = setup({ title: "ab", summary: "" });
    act(() => result.current.leave("title"));
    rerender({ values: { title: "abcdef", summary: "" } });
    expect(result.current.errors).toEqual({});
  });

  it("validateAll shows every problem and reports failure", () => {
    const { result } = setup();
    let ok = true;
    act(() => { ok = result.current.validateAll(); });
    expect(ok).toBe(false);
    expect(Object.keys(result.current.errors)).toEqual(["title", "summary"]);
  });

  it("a server error clears when that field changes", () => {
    const { result, rerender } = setup({ title: "abcdef", summary: "abcd" });
    act(() => result.current.setServerErrors({ summary: "Too similar to another case study" }));
    expect(result.current.errors.summary).toBe("Too similar to another case study");
    rerender({ values: { title: "abcdef", summary: "abcde" } });
    expect(result.current.errors.summary).toBeUndefined();
  });

  it("focuses the first problem in page order", () => {
    const input = document.createElement("input");
    input.id = fieldId("summary");
    input.scrollIntoView = vi.fn();
    document.body.appendChild(input);
    const { result } = setup({ title: "abcdef", summary: "" });
    act(() => { result.current.validateAll(); });
    act(() => result.current.focusFirstError());
    expect(document.activeElement).toBe(input);
    expect(input.scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
  });

  it("links the field to its message for screen readers", () => {
    const { result } = setup();
    act(() => { result.current.validateAll(); });
    expect(result.current.describedBy("title")).toEqual({ "aria-invalid": true, "aria-describedby": "field-title-error" });
    expect(result.current.describedBy("other")).toEqual({});
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/use-form-errors.test.tsx`
Expected: FAIL, because the modules can't be resolved.

- [ ] **Step 3: Implement**

```ts
// components/forms/errors/field-id.ts
export const fieldId = (path: string) => `field-${path.replace(/\./g, "-")}`;
export const errorId = (path: string) => `${fieldId(path)}-error`;
```

```ts
// components/forms/errors/use-form-errors.ts
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { translateIssues, type FieldIssue, type Translator } from "@/lib/validation/messages";
import { valueAt } from "@/lib/validation/messages";
import { errorId, fieldId } from "@/components/forms/errors/field-id";

/**
 * The one error behaviour every form shares: quiet while typing, checked on
 * leaving a field, cleared the moment it's fixed, everything on submit.
 */
export function useFormErrors<T>({
  values,
  validate,
  t,
  order,
}: {
  values: T;
  validate: (values: T) => FieldIssue[];
  t: Translator;
  order: string[];
}) {
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const [server, setServer] = useState<Record<string, string>>({});
  const serverSnapshot = useRef<Record<string, unknown>>({});

  const current = useMemo(() => translateIssues(validate(values), t, values), [validate, values, t]);

  // A server error lives only while its field keeps the value it was reported for.
  const liveServer = useMemo(() => {
    const kept: Record<string, string> = {};
    for (const [path, message] of Object.entries(server)) {
      if (Object.is(valueAt(values, path), serverSnapshot.current[path])) kept[path] = message;
    }
    return kept;
  }, [server, values]);

  const errors = useMemo(() => {
    const visible: Record<string, string> = {};
    for (const path of Object.keys(current)) if (shown.has(path)) visible[path] = current[path];
    return { ...visible, ...liveServer };
  }, [current, shown, liveServer]);

  const leave = useCallback((path: string) => {
    setShown((prev) => (prev.has(path) ? prev : new Set(prev).add(path)));
  }, []);

  const validateAll = useCallback(() => {
    const paths = Object.keys(current);
    setShown((prev) => new Set([...prev, ...paths]));
    return paths.length === 0;
  }, [current]);

  const setServerErrors = useCallback(
    (fields: Record<string, string>) => {
      serverSnapshot.current = Object.fromEntries(Object.keys(fields).map((path) => [path, valueAt(values, path)]));
      setServer(fields);
    },
    [values],
  );

  const focusFirstError = useCallback(() => {
    const visible = { ...current, ...liveServer };
    const first = order.find((path) => visible[path]) ?? Object.keys(visible)[0];
    if (!first) return;
    const element = document.getElementById(fieldId(first));
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    element?.focus({ preventScroll: true });
  }, [current, liveServer, order]);

  const describedBy = useCallback(
    (path: string): { "aria-invalid"?: true; "aria-describedby"?: string } =>
      errors[path] ? { "aria-invalid": true, "aria-describedby": errorId(path) } : {},
    [errors],
  );

  return { errors, leave, validateAll, setServerErrors, focusFirstError, describedBy };
}
```

```tsx
// components/forms/errors/field-error.tsx
import { AlertCircle } from "lucide-react";
import { errorId } from "@/components/forms/errors/field-id";

/** The sentence under a field. Same look in every form. */
export function FieldError({ path, message }: { path: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={errorId(path)} aria-live="polite" className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run lib/__tests__/use-form-errors.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add components/forms/errors/ lib/__tests__/use-form-errors.test.tsx
git commit -m "feat(forms): one error behaviour for every form — quiet while typing, clear when fixed"
```

---

### Task 5: `WhatsLeft` checklist

**Files:**
- Create: `components/forms/errors/whats-left.tsx`
- Modify: `messages/{en,es,fr,ar}.json` (add `forms.whatsLeft`)
- Test: `lib/__tests__/whats-left.test.tsx`

**Interfaces:**
- Consumes: `fieldId` (Task 4).
- Produces:
  - `type WhatsLeftItem = { id: string; label: string; done: boolean; target: string; severity: "required" | "nudge" }`
  - `WhatsLeft({ items, status, actions }: { items: WhatsLeftItem[]; status?: ReactNode; actions: ReactNode })`: desktop sticky panel plus a phone bottom bar that opens a drawer
  - `requiredLeft(items: WhatsLeftItem[]): number`

- [ ] **Step 1: Add strings**

In each `messages/<locale>.json` `forms` object, add:

- en: `"whatsLeft": { "heading": "What's left", "allDone": "Everything's ready to send", "left": "{count, plural, one {# thing left} other {# things left}}", "open": "Show what's left", "suggestion": "Suggestion" }`
- es: `"whatsLeft": { "heading": "Qué falta", "allDone": "Todo listo para enviar", "left": "{count, plural, one {Falta # cosa} other {Faltan # cosas}}", "open": "Ver qué falta", "suggestion": "Sugerencia" }`
- fr: `"whatsLeft": { "heading": "Ce qu'il reste", "allDone": "Tout est prêt à être envoyé", "left": "{count, plural, one {# élément restant} other {# éléments restants}}", "open": "Voir ce qu'il reste", "suggestion": "Suggestion" }`
- ar: `"whatsLeft": { "heading": "ما تبقّى", "allDone": "كل شيء جاهز للإرسال", "left": "{count, plural, zero {لا شيء متبقٍ} one {عنصر واحد متبقٍ} two {عنصران متبقيان} few {# عناصر متبقية} many {# عنصرًا متبقيًا} other {# عنصر متبقٍ}}", "open": "عرض ما تبقّى", "suggestion": "اقتراح" }`

- [ ] **Step 2: Write the failing test**

```tsx
// lib/__tests__/whats-left.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import { WhatsLeft, requiredLeft, type WhatsLeftItem } from "@/components/forms/errors/whats-left";
import { fieldId } from "@/components/forms/errors/field-id";

afterEach(() => cleanup());

const items: WhatsLeftItem[] = [
  { id: "title", label: "Add a title", done: true, target: "title.en", severity: "required" },
  { id: "where", label: "Add where this took place", done: false, target: "location", severity: "required" },
  { id: "pin", label: "Add a specific place to appear on the map", done: false, target: "location", severity: "nudge" },
];

function mount(list = items) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ forms: en.forms }}>
      <WhatsLeft items={list} actions={<button type="button">Submit</button>} />
    </NextIntlClientProvider>,
  );
}

describe("WhatsLeft", () => {
  it("counts only required items as left", () => {
    expect(requiredLeft(items)).toBe(1);
  });

  it("community alone satisfies location: a nudge never counts as left", () => {
    expect(requiredLeft(items.map((i) => (i.id === "where" ? { ...i, done: true } : i)))).toBe(0);
  });

  it("jumps to the field when an item is tapped", () => {
    const target = document.createElement("input");
    target.id = fieldId("location");
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    mount();
    fireEvent.click(screen.getAllByRole("button", { name: "Add where this took place" })[0]);
    expect(document.activeElement).toBe(target);
  });

  it("says when everything is ready", () => {
    mount(items.map((i) => ({ ...i, done: true })));
    expect(screen.getAllByText("Everything's ready to send").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/whats-left.test.tsx`
Expected: FAIL, because the module can't be resolved.

- [ ] **Step 4: Implement**

```tsx
// components/forms/errors/whats-left.tsx
"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, Circle, Lightbulb, ListChecks } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { fieldId } from "@/components/forms/errors/field-id";
import { cn } from "@/lib/utils";

export type WhatsLeftItem = { id: string; label: string; done: boolean; target: string; severity: "required" | "nudge" };

export const requiredLeft = (items: WhatsLeftItem[]) =>
  items.filter((item) => item.severity === "required" && !item.done).length;

function jump(target: string) {
  const element = document.getElementById(fieldId(target));
  element?.scrollIntoView({ block: "center", behavior: "smooth" });
  element?.focus({ preventScroll: true });
}

function Checklist({ items, onJump }: { items: WhatsLeftItem[]; onJump?: () => void }) {
  const t = useTranslations("forms.whatsLeft");
  const visible = items.filter((item) => item.severity === "required" || !item.done);
  return (
    <ul className="space-y-1">
      {visible.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => { jump(item.target); onJump?.(); }}
            className={cn(
              "flex min-h-11 w-full items-start gap-2 rounded-lg px-2 py-2 text-start text-sm transition-colors hover:bg-muted",
              item.done ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {item.severity === "nudge" ? (
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-ccm-amber" aria-label={t("suggestion")} />
            ) : item.done ? (
              <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className={cn(item.done && item.severity === "required" && "line-through decoration-muted-foreground/40")}>{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** "What's left": a sticky side panel on desktop, a bottom bar + drawer on phones. */
export function WhatsLeft({ items, status, actions }: { items: WhatsLeftItem[]; status?: ReactNode; actions: ReactNode }) {
  const t = useTranslations("forms.whatsLeft");
  const left = requiredLeft(items);
  const summary = left === 0 ? t("allDone") : t("left", { count: left });

  return (
    <>
      <aside className="sticky top-24 hidden w-72 shrink-0 self-start rounded-2xl border bg-card p-4 shadow-sm lg:block" aria-label={t("heading")}>
        <h2 className="font-heading text-sm font-semibold text-ccm-midnight">{t("heading")}</h2>
        <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{summary}</p>
        <div className="mt-3"><Checklist items={items} /></div>
        {status && <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">{status}</div>}
        <div className="mt-3 grid gap-2">{actions}</div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Drawer>
            <DrawerTrigger asChild>
              <button type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-start text-sm" aria-label={t("open")}>
                <ListChecks className="size-4 shrink-0 text-ccm-water" aria-hidden />
                <span className="truncate font-medium" aria-live="polite">{summary}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85dvh] overflow-y-auto px-4 pb-6">
              <DrawerHeader className="px-0 text-start"><DrawerTitle>{t("heading")}</DrawerTitle></DrawerHeader>
              <Checklist items={items} />
              {status && <div className="mt-4 text-xs text-muted-foreground">{status}</div>}
            </DrawerContent>
          </Drawer>
          <div className="flex shrink-0 gap-2">{actions}</div>
        </div>
      </div>
    </>
  );
}
```

Close the drawer after a jump by passing `onJump`. In the phone drawer, wrap `Checklist` so it receives a close callback: use the Drawer's controlled `open` state (`const [open, setOpen] = useState(false)` on the `Drawer`, and `onJump={() => setOpen(false)}`). Add `useState` to the React import.

- [ ] **Step 5: Run it and confirm it passes**

Run: `npx vitest run lib/__tests__/whats-left.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add components/forms/errors/whats-left.tsx lib/__tests__/whats-left.test.tsx messages/*.json
git commit -m "feat(forms): a What's left checklist that jumps to each missing item"
```

---

# Phase 2: Case study form (project 2)

### Task 6: One case study rule set, shared by form and server

**Files:**
- Modify: `lib/validation/case-study.ts` (replace `caseStudySubmissionSchema`, rebuild `caseStudyDraftSchema` on the same base)
- Modify: `lib/__tests__/case-study-drafts-route.test.ts` (only if a draft fixture used `topic`; keep it passing)
- Test: `lib/__tests__/case-study-rules.test.ts`

**Interfaces:**
- Consumes: `ERROR_KEYS` (Task 1).
- Produces:
  - `WRITING_LANGUAGES = ["en", "es", "fr", "ar"] as const`, `type WritingLanguage`
  - `CASE_STUDY_MINIMUMS = { title: 5, summary: 50, englishSummary: 20 }`
  - `placeSchema` (zod) for `{ lat, lng, text, precision, countryCode3, country?, city? }`
  - `makeCaseStudySubmissionSchema({ themeTagIds }: { themeTagIds: ReadonlySet<string> })`, returning a zod schema whose output type is `CaseStudySubmission`
  - `caseStudyDraftSchema` (unchanged export name, same relaxations as today, plus `originalLanguage`, `place`, `imageAssetId`)
  - `CASE_STUDY_FIELD_ORDER: string[]`, the page order used by `focusFirstError`: `["title.<lang>", "excerpt.<lang>", "content", "title.en", "excerpt.en", "authors", "authors.N.name", "authors.N.email", "location", "studyPeriod.endDate", "tags"]`, built by `caseStudyFieldOrder(lang, authorCount)`
  - `hasStoryText(content: unknown): boolean`
  - `stripServerOwnedDraftKeys` (unchanged)

Rules implemented in `superRefine` (paths and keys exact):

| Condition | Path | Key | Params |
|---|---|---|---|
| title in writing language empty | `title.<lang>` | `titleRequired` | — |
| title in writing language shorter than 5 | `title.<lang>` | `titleTooShort` | `{ min: 5 }` |
| summary in writing language empty | `excerpt.<lang>` | `summaryRequired` | — |
| summary shorter than 50 | `excerpt.<lang>` | `summaryTooShort` | `{ min: 50 }` |
| lang ≠ en and English title shorter than 5 | `title.en` | `englishTitleRequired` | — |
| lang ≠ en and English summary shorter than 20 | `excerpt.en` | `englishSummaryTooShort` | `{ min: 20 }` |
| no text in story | `content` | `storyRequired` | — |
| no tag in `themeTagIds` | `tags` | `themeRequired` | — |
| no `place` and no `relatedCommunity` | `location` | `locationRequired` | — |
| end date before start date | `studyPeriod.endDate` | `endBeforeStart` | — |

All of these also live in `superRefine`, not as field-level zod rules, because zod skips `superRefine` whenever a field-level rule fails, so one blank co-author name would hide every other problem:

- Title or excerpt (any language) over `LIMITS.caseStudy.title` / `LIMITS.caseStudy.excerpt` → `tooLong`, `{ max }`.
- No authors → `authors`, `authorsRequired`.
- Each author: blank `name` → `authors.N.name`, `authorNameRequired`; too long → `tooLong`; a non-empty `email` that isn't an email → `authors.N.email`, `authorEmail`.
- `organizationName` too long → `tooLong`.

The base object only checks types.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/case-study-rules.test.ts
import { describe, expect, it } from "vitest";
import {
  caseStudyDraftSchema,
  caseStudyFieldOrder,
  makeCaseStudySubmissionSchema,
} from "@/lib/validation/case-study";
import { toFieldIssues } from "@/lib/validation/messages";

const schema = makeCaseStudySubmissionSchema({ themeTagIds: new Set(["theme-1"]) });
const story = [{ _type: "block", children: [{ _type: "span", text: "Something happened." }] }];
const valid = {
  originalLanguage: "en",
  title: { en: "Floods in Lagos" },
  excerpt: { en: "A".repeat(50) },
  content: story,
  authors: [{ name: "Ada" }],
  tags: ["theme-1"],
  relatedCommunity: "community-1",
};

const problems = (input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? {} : Object.fromEntries(toFieldIssues(result.error).map((i) => [i.path, i.key]));
};

describe("case study rules", () => {
  it("accepts a complete English submission with only a community for location", () => {
    expect(problems(valid)).toEqual({});
  });

  it("names every missing piece in plain keys", () => {
    expect(problems({ originalLanguage: "en", title: {}, content: [], authors: [], tags: [] })).toEqual({
      "title.en": "title.required",
      "excerpt.en": "summary.required",
      content: "story.required",
      authors: "authors.required",
      tags: "tags.themeRequired",
      location: "location.required",
    });
  });

  it("arabic writing language needs Arabic text plus a short English title and summary", () => {
    const input = { ...valid, originalLanguage: "ar", title: { ar: "فيضانات لاغوس" }, excerpt: { ar: "ب".repeat(50) } };
    expect(problems(input)).toEqual({ "title.en": "englishTitle.required", "excerpt.en": "englishSummary.tooShort" });
    expect(problems({ ...input, title: { ar: "فيضانات لاغوس", en: "Lagos floods" }, excerpt: { ar: "ب".repeat(50), en: "E".repeat(20) } })).toEqual({});
  });

  it("a non-theme tag does not satisfy the theme rule", () => {
    expect(problems({ ...valid, tags: ["audience-tag"] })).toEqual({ tags: "tags.themeRequired" });
  });

  it("a place alone satisfies location", () => {
    const place = { lat: 6.5, lng: 3.4, text: "Lagos, Nigeria", precision: "city", countryCode3: "NGA" };
    const { relatedCommunity: _drop, ...rest } = valid;
    void _drop;
    expect(problems({ ...rest, place })).toEqual({});
  });

  it("shows co-author name and email problems under that co-author", () => {
    expect(problems({ ...valid, authors: [{ name: "Ada" }, { name: " ", email: "not-an-email" }] })).toEqual({
      "authors.1.name": "author.nameRequired",
      "authors.1.email": "author.email",
    });
  });

  it("a blank co-author never hides the other problems", () => {
    expect(problems({ ...valid, title: {}, authors: [{ name: "" }] })).toEqual({
      "title.en": "title.required",
      "authors.0.name": "author.nameRequired",
    });
  });

  it("catches an end date before the start date", () => {
    expect(problems({ ...valid, studyPeriod: { startDate: "2024-05-01", endDate: "2024-04-01" } })).toEqual({
      "studyPeriod.endDate": "dates.endBeforeStart",
    });
  });

  it("a draft needs nothing", () => {
    expect(caseStudyDraftSchema.safeParse({}).success).toBe(true);
    expect(caseStudyDraftSchema.safeParse({ originalLanguage: "ar", place: { text: "Lag" } }).success).toBe(true);
  });

  it("orders fields the way the page shows them", () => {
    expect(caseStudyFieldOrder("ar", 2).slice(0, 5)).toEqual(["title.ar", "excerpt.ar", "content", "title.en", "excerpt.en"]);
    expect(caseStudyFieldOrder("en", 2)).toContain("authors.1.email");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/case-study-rules.test.ts`
Expected: FAIL, because `makeCaseStudySubmissionSchema` is not exported.

- [ ] **Step 3: Rewrite `lib/validation/case-study.ts`**

Keep `generateCaseStudySlug`, `SERVER_OWNED_DRAFT_KEYS` and `stripServerOwnedDraftKeys` exactly as they are. Replace everything from `const optionalString` down to the end of `caseStudyDraftSchema` with:

```ts
import { ERROR_KEYS as K } from '@/lib/validation/error-keys'

const optionalString = z.string().optional()

export const WRITING_LANGUAGES = ['en', 'es', 'fr', 'ar'] as const
export type WritingLanguage = (typeof WRITING_LANGUAGES)[number]

export const CASE_STUDY_MINIMUMS = { title: 5, summary: 50, englishSummary: 20 } as const

// Types only: every rule lives in superRefine so all problems are reported at once.
const localizedText = () =>
    z.object({ en: optionalString, es: optionalString, fr: optionalString, ar: optionalString }).passthrough()

export const placeSchema = z.object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    text: z.string().min(1).max(LIMITS.caseStudy.placeText),
    precision: z.enum(['exact', 'city', 'country', 'region']),
    countryCode3: z.string().regex(/^[A-Z]{3}$/).nullable(),
    country: z.string().max(120).optional(),
    city: z.string().max(120).optional(),
})

/** True when a Portable Text body has at least one span with real text. */
export function hasStoryText(content: unknown): boolean {
    return (
        Array.isArray(content) &&
        content.some(
            (block) =>
                block?._type === 'block' &&
                Array.isArray(block.children) &&
                block.children.some((child: { text?: unknown }) => typeof child?.text === 'string' && child.text.trim().length > 0),
        )
    )
}

const authorSchema = z
    .object({ name: z.string().default(''), email: optionalString, role: optionalString, userId: optionalString })
    .passthrough()

const EMAIL = z.string().email()

const baseShape = {
    originalLanguage: z.enum(WRITING_LANGUAGES).default('en'),
    title: localizedText(),
    excerpt: localizedText().optional(),
    content: z.array(z.record(z.unknown())),
    layout: z.enum(['story', 'feature', 'report']).optional(),
    collaborationId: optionalString,
    editId: optionalString,
    authors: z.array(authorSchema),
    tags: z.array(z.string().min(1)),
    suggestedTags: z.array(z.string().trim().min(1).max(LIMITS.tags.suggestion)).max(LIMITS.tags.suggestions).optional().default([]),
    organizationName: optionalString,
    relatedCommunity: optionalString,
    studyPeriod: z.object({ startDate: optionalString, endDate: optionalString }).passthrough().optional(),
    place: placeSchema.nullable().optional(),
    imageAssetId: optionalString,
}

const caseStudyBase = z.object(baseShape).passthrough()

const blank = (value: string | undefined) => !value || value.trim().length === 0

export function makeCaseStudySubmissionSchema({ themeTagIds }: { themeTagIds: ReadonlySet<string> }) {
    return caseStudyBase.superRefine((data, ctx) => {
        const lang = data.originalLanguage
        const title = data.title[lang]
        const summary = data.excerpt?.[lang]
        const add = (path: (string | number)[], message: string, params?: Record<string, number>) =>
            ctx.addIssue({ code: z.ZodIssueCode.custom, path, message, ...(params ? { params } : {}) })

        if (blank(title)) add(['title', lang], K.titleRequired)
        else if (title!.trim().length < CASE_STUDY_MINIMUMS.title) add(['title', lang], K.titleTooShort, { min: CASE_STUDY_MINIMUMS.title })

        if (blank(summary)) add(['excerpt', lang], K.summaryRequired)
        else if (summary!.trim().length < CASE_STUDY_MINIMUMS.summary) add(['excerpt', lang], K.summaryTooShort, { min: CASE_STUDY_MINIMUMS.summary })

        if (lang !== 'en') {
            if ((data.title.en?.trim().length ?? 0) < CASE_STUDY_MINIMUMS.title) add(['title', 'en'], K.englishTitleRequired)
            if ((data.excerpt?.en?.trim().length ?? 0) < CASE_STUDY_MINIMUMS.englishSummary)
                add(['excerpt', 'en'], K.englishSummaryTooShort, { min: CASE_STUDY_MINIMUMS.englishSummary })
        }

        if (!hasStoryText(data.content)) add(['content'], K.storyRequired)
        if (!data.tags.some((id) => themeTagIds.has(id))) add(['tags'], K.themeRequired)
        if (!data.place && blank(data.relatedCommunity)) add(['location'], K.locationRequired)

        const { startDate, endDate } = data.studyPeriod ?? {}
        if (startDate && endDate && endDate < startDate) add(['studyPeriod', 'endDate'], K.endBeforeStart)

        for (const l of WRITING_LANGUAGES) {
            if ((data.title[l]?.length ?? 0) > LIMITS.caseStudy.title) add(['title', l], K.tooLong, { max: LIMITS.caseStudy.title })
            if ((data.excerpt?.[l]?.length ?? 0) > LIMITS.caseStudy.excerpt) add(['excerpt', l], K.tooLong, { max: LIMITS.caseStudy.excerpt })
        }
        if (data.authors.length === 0) add(['authors'], K.authorsRequired)
        data.authors.forEach((author, i) => {
            if (blank(author.name)) add(['authors', i, 'name'], K.authorNameRequired)
            else if (author.name.length > LIMITS.caseStudy.authorName) add(['authors', i, 'name'], K.tooLong, { max: LIMITS.caseStudy.authorName })
            if (author.email && author.email.trim() && !EMAIL.safeParse(author.email.trim()).success) add(['authors', i, 'email'], K.authorEmail)
        })
        if ((data.organizationName?.length ?? 0) > LIMITS.caseStudy.organizationName)
            add(['organizationName'], K.tooLong, { max: LIMITS.caseStudy.organizationName })
    })
}

export type CaseStudySubmission = z.infer<ReturnType<typeof makeCaseStudySubmissionSchema>>

/** Page order of every checked field, for "focus the first problem". */
export function caseStudyFieldOrder(lang: WritingLanguage, authorCount: number): string[] {
    const authors = Array.from({ length: authorCount }, (_, i) => [`authors.${i}.name`, `authors.${i}.email`]).flat()
    return [
        `title.${lang}`, `excerpt.${lang}`, 'content',
        ...(lang === 'en' ? [] : ['title.en', 'excerpt.en']),
        'authors', ...authors, 'organizationName',
        'location', 'studyPeriod.endDate', 'tags',
    ]
}

/** Autosave schema: the same fields with every rule relaxed. A draft requires nothing. */
export const caseStudyDraftSchema = caseStudyBase
    .partial()
    .extend({
        title: localizedText().optional(),
        excerpt: localizedText().optional(),
        content: z.array(z.record(z.unknown())).optional(),
        authors: z.array(z.object({ name: optionalString, email: optionalString, role: optionalString, userId: optionalString }).passthrough()).optional(),
        tags: z.array(z.string()).optional(),
        selectedTags: z.array(z.string()).optional(),
        place: placeSchema.partial().nullable().optional(),
        originalLanguage: z.enum(WRITING_LANGUAGES).optional(),
    })
    .passthrough()
```

Then delete the old `export const caseStudySubmissionSchema = …` and `export type CaseStudySubmission = …`. Keep a one-line compatibility export only if another importer needs the old name: run `grep -rn "caseStudySubmissionSchema" app lib components` and update each hit to `makeCaseStudySubmissionSchema` (the submit route is changed in Task 15).

- [ ] **Step 4: Run it and confirm it passes, and the old draft tests still pass**

Run: `npx vitest run lib/__tests__/case-study-rules.test.ts lib/__tests__/case-study-drafts-route.test.ts`
Expected: PASS for both. If a drafts-route test fails on a removed field, fix that fixture only; the draft rules must stay "requires nothing".

- [ ] **Step 5: Commit**

```bash
git add lib/validation/case-study.ts lib/__tests__/case-study-rules.test.ts lib/__tests__/case-study-drafts-route.test.ts
git commit -m "feat(case-studies): one rule set shared by form and server, in plain keys"
```

---

### Task 7: Database: topic optional, original language, place on drafts, story body not required per language

**Files:**
- Modify: `payload/collections/case-studies.ts` (`topic`: remove `required: true`, add `admin.description`; add `originalLanguage`; `content`: `localizedRichText("content")` without `required`)
- Modify: `payload/collections/case-study-drafts.ts` (add `locationDisplayText`, `locationPrecision`, `locationCountryCode`, `imageAssetId` alias fields)
- Create: `migrations/<timestamp>_human_friendly_forms.ts` + `.json` (generated)
- Modify: `migrations/index.ts` (generated)
- Test: `lib/__tests__/case-study-schema-fields.test.ts`

**Interfaces:**
- Produces:
  - Payload fields `caseStudies.originalLanguage` (select `en|es|fr|ar`, default `en`)
  - `caseStudyDrafts.locationDisplayText` (text)
  - `caseStudyDrafts.locationPrecision` (select `exact|city|country|region`)
  - `caseStudyDrafts.locationCountryCode` (text)

Why `content` loses `required`: Payload checks a required localized field in the locale being written. Writing the English title onto an Arabic-original case study would then fail for the empty English body. The submission rule in Task 6 still requires a story.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/case-study-schema-fields.test.ts
import { describe, expect, it } from "vitest";
import config from "@/payload.config";

const field = (fields: unknown[], name: string) =>
  (fields as Array<{ name?: string }>).find((f) => f.name === name) as Record<string, unknown> | undefined;

describe("case study fields", async () => {
  const resolved = await config;
  const caseStudies = resolved.collections.find((c) => c.slug === "caseStudies")!;
  const drafts = resolved.collections.find((c) => c.slug === "caseStudyDrafts")!;

  it("no longer requires the old topic", () => {
    expect(field(caseStudies.fields, "topic")?.required).toBeFalsy();
  });

  it("records the language the story was written in", () => {
    const original = field(caseStudies.fields, "originalLanguage");
    expect(original?.defaultValue).toBe("en");
    expect((original?.options as Array<{ value: string }>).map((o) => o.value)).toEqual(["en", "es", "fr", "ar"]);
  });

  it("does not require a story body in every language", () => {
    expect(field(caseStudies.fields, "content")?.required).toBeFalsy();
  });

  it("keeps the place on drafts", () => {
    for (const name of ["locationDisplayText", "locationPrecision", "locationCountryCode"]) {
      expect(field(drafts.fields, name)).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/case-study-schema-fields.test.ts`
Expected: FAIL on 4 expectations.

- [ ] **Step 3: Change the collections**

In `payload/collections/case-studies.ts`:
- `localizedRichText("content", { required: true })` → `localizedRichText("content")`
- In the `topic` field: delete `required: true,` and add `admin: { description: "Retired — replaced by theme tags. Kept only until the topic → tag conversion is confirmed in production." },`
- After the `layout` field, add:

```ts
    {
      name: "originalLanguage",
      type: "select",
      defaultValue: "en",
      options: [
        { label: "English", value: "en" },
        { label: "Español", value: "es" },
        { label: "Français", value: "fr" },
        { label: "العربية", value: "ar" },
      ],
      admin: { description: "The language the story was written in. Readers of other languages see it with an 'Originally written in' note." },
    },
```

In `payload/collections/case-study-drafts.ts`, after the `studyLocation` field, add:

```ts
    { name: "locationDisplayText", type: "text" },
    {
      name: "locationPrecision",
      type: "select",
      options: ["exact", "city", "country", "region"].map((value) => ({ label: value, value })),
    },
    { name: "locationCountryCode", type: "text" },
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run lib/__tests__/case-study-schema-fields.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Generate the migration and read it**

Run: `pnpm exec payload migrate:create human_friendly_forms`
Then open the new `migrations/*_human_friendly_forms.ts`. It must contain **only**:
- `ALTER TABLE "case_studies" ALTER COLUMN "topic" DROP NOT NULL;` (and the same on `_case_studies_v`'s `version_topic` if present);
- the new enum and `original_language` columns on `case_studies` and `_case_studies_v` with default `'en'`;
- the three new columns (and one enum) on `case_study_drafts`.

If the generated file contains anything else (for example drops or renames of unrelated columns), **stop**. Delete the generated files and report back: the committed snapshot has drifted from the database and needs the user's decision.

Add a backfill line at the end of `up`: `UPDATE "case_studies" SET "original_language" = 'en' WHERE "original_language" IS NULL;`

- [ ] **Step 6: Apply to the dev database only**

Run: `pnpm exec payload migrate:status`. Confirm the target is the dev database: the newest applied migration listed is `20260920_141339_tag_suggestions`, and `.env.local`'s `PAYLOAD_DATABASE_URL` host contains `lucky-waterfall`. Then run `pnpm exec payload migrate`.
Expected: `human_friendly_forms` is reported as migrated. `migrate:status` shows it as ran.

- [ ] **Step 7: Check that /admin still loads**

Run `pnpm dev` in the background, then `curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/admin`.
Expected: `200`. Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add payload/collections/case-studies.ts payload/collections/case-study-drafts.ts migrations/ payload-types.ts lib/__tests__/case-study-schema-fields.test.ts
git commit -m "feat(case-studies): record the original language, keep the place on drafts, retire the required topic"
```

---

### Task 8: Place search returns names and precision; region follows the place

**Files:**
- Modify: `lib/geocoding.ts` (`GeocodeSuggestion` gains `country`, `city`, `precision`; extract a pure `toSuggestion(row)`)
- Create: `lib/case-studies/derive-region.ts`
- Test: `lib/__tests__/geocode-suggestion.test.ts`, `lib/__tests__/derive-region.test.ts`

**Interfaces:**
- Produces:
  - `toSuggestion(row: NominatimRow): GeocodeSuggestion | null`
  - `GeocodeSuggestion = { label: string; lat: number; lng: number; countryCode3: string | null; kind: string; country: string | null; city: string | null; precision: "exact" | "city" | "country" | "region" }`
  - `deriveRegion({ communityRegion, countryCode3 }: { communityRegion?: string | null; countryCode3?: string | null }): RegionCode | null`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/geocode-suggestion.test.ts
import { describe, expect, it } from "vitest";
import { toSuggestion } from "@/lib/geocoding";

const row = (over: Record<string, unknown>) => ({
  display_name: "Lagos, Lagos State, Nigeria", lat: "6.45", lon: "3.39", type: "city", addresstype: "city",
  address: { city: "Lagos", country: "Nigeria", country_code: "ng" }, ...over,
});

describe("toSuggestion", () => {
  it("names the city and country and sets precision from what was found", () => {
    expect(toSuggestion(row({}))).toMatchObject({ city: "Lagos", country: "Nigeria", countryCode3: "NGA", precision: "city" });
  });

  it("a country result is country precision with no city", () => {
    expect(toSuggestion(row({ display_name: "Kenya", type: "administrative", addresstype: "country", address: { country: "Kenya", country_code: "ke" } })))
      .toMatchObject({ city: null, country: "Kenya", precision: "country" });
  });

  it("a state or province is region precision", () => {
    expect(toSuggestion(row({ addresstype: "state", type: "administrative", address: { state: "Sindh", country: "Pakistan", country_code: "pk" } })))
      .toMatchObject({ precision: "region", city: null });
  });

  it("a village or town counts as a city", () => {
    expect(toSuggestion(row({ addresstype: "village", type: "village", address: { village: "Kibera", country: "Kenya", country_code: "ke" } })))
      .toMatchObject({ city: "Kibera", precision: "city" });
  });

  it("a building or site is an exact point", () => {
    expect(toSuggestion(row({ addresstype: "amenity", type: "university" }))).toMatchObject({ precision: "exact" });
  });

  it("drops rows without usable coordinates", () => {
    expect(toSuggestion(row({ lat: "x" }))).toBeNull();
  });
});
```

```ts
// lib/__tests__/derive-region.test.ts
import { describe, expect, it } from "vitest";
import { deriveRegion } from "@/lib/case-studies/derive-region";

describe("deriveRegion", () => {
  it("prefers the community's region", () => {
    expect(deriveRegion({ communityRegion: "ssa", countryCode3: "FRA" })).toBe("ssa");
  });
  it("falls back to the country's region", () => {
    expect(deriveRegion({ countryCode3: "NGA" })).toBe("ssa");
  });
  it("is empty when nothing is known", () => {
    expect(deriveRegion({})).toBeNull();
    expect(deriveRegion({ communityRegion: "not-a-region" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run lib/__tests__/geocode-suggestion.test.ts lib/__tests__/derive-region.test.ts`
Expected: FAIL, because the exports are missing.

- [ ] **Step 3: Implement `toSuggestion` and use it in `geocodeQuery`**

In `lib/geocoding.ts`, replace the `GeocodeSuggestion` interface and the `rows.map(…)` in `geocodeQuery` with:

```ts
export interface GeocodeSuggestion {
    label: string;
    lat: number;
    lng: number;
    /** ISO alpha-3, uppercased; null when Nominatim gives no country. */
    countryCode3: string | null;
    /** Nominatim result type: city / administrative / country / … */
    kind: string;
    country: string | null;
    city: string | null;
    /** How finely the map should show it, read from what was found. */
    precision: 'exact' | 'city' | 'country' | 'region';
}

export type NominatimRow = {
    display_name: string; lat: string; lon: string; type: string; addresstype?: string;
    address?: { country_code?: string; country?: string; city?: string; town?: string; village?: string; municipality?: string; county?: string };
};

const CITY_TYPES = new Set(['city', 'town', 'village', 'municipality', 'hamlet', 'suburb']);
const REGION_TYPES = new Set(['state', 'province', 'region', 'county', 'state_district']);

export function toSuggestion(r: NominatimRow): GeocodeSuggestion | null {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const a2 = r.address?.country_code?.toUpperCase();
    const kindOf = r.addresstype ?? r.type;
    const precision: GeocodeSuggestion['precision'] =
        kindOf === 'country' ? 'country' : REGION_TYPES.has(kindOf) ? 'region' : CITY_TYPES.has(kindOf) ? 'city' : 'exact';
    const a = r.address ?? {};
    const city = precision === 'country' || precision === 'region' ? null : (a.city ?? a.town ?? a.village ?? a.municipality ?? null);
    return {
        label: r.display_name,
        lat,
        lng,
        countryCode3: a2 ? (countriesLib.alpha2ToAlpha3(a2) ?? null) : null,
        kind: r.type,
        country: a.country ?? null,
        city,
        precision,
    };
}
```

and in `geocodeQuery`: `const rows = (await response.json()) as NominatimRow[]; return rows.map(toSuggestion).filter((s): s is GeocodeSuggestion => s !== null);`

- [ ] **Step 4: Implement `deriveRegion`**

```ts
// lib/case-studies/derive-region.ts
import { isoToRegion, REGION_MEMBERSHIP } from "@/lib/maps/iso-to-region";

type RegionCode = NonNullable<ReturnType<typeof isoToRegion>>;
const REGION_CODES = new Set<string>(Object.values(REGION_MEMBERSHIP));

/** A case study's fixed-7 region: its community's, else its country's. */
export function deriveRegion({
  communityRegion,
  countryCode3,
}: {
  communityRegion?: string | null;
  countryCode3?: string | null;
}): RegionCode | null {
  if (communityRegion && REGION_CODES.has(communityRegion)) return communityRegion as RegionCode;
  return countryCode3 ? isoToRegion(countryCode3) : null;
}
```

- [ ] **Step 5: Run them and confirm they pass**

Run: `npx vitest run lib/__tests__/geocode-suggestion.test.ts lib/__tests__/derive-region.test.ts lib/maps/__tests__/iso-to-region.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/geocoding.ts lib/case-studies/derive-region.ts lib/__tests__/geocode-suggestion.test.ts lib/__tests__/derive-region.test.ts
git commit -m "feat(location): place search names the city and country, and region follows the place"
```

---

### Task 9: Place search in the form: pick, preview, no coordinates

**Files:**
- Modify: `components/forms/place-picker.tsx`
- Modify: `messages/{en,es,fr,ar}.json` (`placePicker` namespace)
- Test: `lib/__tests__/place-picker.test.tsx`

**Interfaces:**
- Consumes: `GeocodeSuggestion` fields from `/api/geo/search` (Task 8).
- Produces:
  - `PlaceValue = { lat: number; lng: number; text: string; precision: 'exact'|'city'|'country'|'region'; countryCode3: string | null; country?: string | null; city?: string | null }`
  - `PlacePicker({ value, onChange, inputId, describedBy, onBlur })`: `inputId` is set on the search input so `focusFirstError` can reach it (the form passes `fieldId("location")`).

Changes:
- No precision chips. Precision comes from the suggestion.
- The search input gets `id={inputId}`, `onBlur` and `describedBy` attributes.
- After picking, show a card with the place name and a pin preview (the existing `RegionChoropleth` + pin), an editable "How should we name this place?" input, and "Change" (clears and refocuses the search).
- Show "Searching…" while searching. When a search of ≥ 2 characters returns nothing, show `t('noResults')`: "No places found. Try the nearest town, the country, or the region."
- The suggestion row shows the label and a translated kind: `t('kind.city' | 'kind.country' | 'kind.region' | 'kind.exact')`, from `precision`.
- Keyboard: ArrowUp/ArrowDown move through suggestions, Enter picks, Escape closes. Set `role="combobox"`, `aria-expanded`, `aria-controls` on the input and `role="option"`/`aria-selected` on rows.

- [ ] **Step 1: Update strings**

Replace the `placePicker` object in each locale with (keep any extra keys used elsewhere: run `grep -rn "placePicker" components app lib` and keep keys still referenced):

- en: `{ "searchLabel": "Where did this take place?", "searchPlaceholder": "Search a town, city, region or country…", "searching": "Searching…", "noResults": "No places found. Try the nearest town, the country, or the region.", "hint": "Can't find it? Search for the country or region instead.", "displayLabel": "How should we name this place?", "change": "Change", "kind": { "exact": "Place", "city": "Town or city", "region": "Region", "country": "Country" }, "clear": "Remove location" }`
- es: `{ "searchLabel": "¿Dónde ocurrió?", "searchPlaceholder": "Busca un pueblo, ciudad, región o país…", "searching": "Buscando…", "noResults": "No se encontraron lugares. Prueba con el pueblo más cercano, el país o la región.", "hint": "¿No lo encuentras? Busca el país o la región.", "displayLabel": "¿Cómo debemos nombrar este lugar?", "change": "Cambiar", "kind": { "exact": "Lugar", "city": "Pueblo o ciudad", "region": "Región", "country": "País" }, "clear": "Quitar ubicación" }`
- fr: `{ "searchLabel": "Où cela s'est-il passé ?", "searchPlaceholder": "Cherchez une ville, un village, une région ou un pays…", "searching": "Recherche…", "noResults": "Aucun lieu trouvé. Essayez la ville la plus proche, le pays ou la région.", "hint": "Introuvable ? Cherchez plutôt le pays ou la région.", "displayLabel": "Comment nommer ce lieu ?", "change": "Modifier", "kind": { "exact": "Lieu", "city": "Ville ou village", "region": "Région", "country": "Pays" }, "clear": "Retirer le lieu" }`
- ar: `{ "searchLabel": "أين حدث ذلك؟", "searchPlaceholder": "ابحث عن بلدة أو مدينة أو منطقة أو دولة…", "searching": "جارٍ البحث…", "noResults": "لم يُعثر على أماكن. جرّب أقرب بلدة أو الدولة أو المنطقة.", "hint": "لم تجده؟ ابحث عن الدولة أو المنطقة بدلًا من ذلك.", "displayLabel": "بأي اسم نعرض هذا المكان؟", "change": "تغيير", "kind": { "exact": "مكان", "city": "بلدة أو مدينة", "region": "منطقة", "country": "دولة" }, "clear": "إزالة الموقع" }`

- [ ] **Step 2: Write the failing test**

```tsx
// lib/__tests__/place-picker.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@/components/maps/region-choropleth", () => ({ RegionChoropleth: () => <div data-testid="map" /> }));
import { PlacePicker, type PlaceValue } from "@/components/forms/place-picker";

const lagos = { label: "Lagos, Nigeria", lat: 6.45, lng: 3.39, countryCode3: "NGA", kind: "city", country: "Nigeria", city: "Lagos", precision: "city", vx: 500, vy: 250 };

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function mount(onChange = vi.fn(), value: PlaceValue | null = null) {
  render(
    <NextIntlClientProvider locale="en" messages={{ placePicker: en.placePicker, common: en.common }}>
      <PlacePicker value={value} onChange={onChange} inputId="field-location" />
    </NextIntlClientProvider>,
  );
  return onChange;
}

describe("PlacePicker", () => {
  it("picks a suggestion with names and precision, never showing coordinates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ results: [lagos] }))));
    const onChange = mount();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Lagos" } });
    await vi.advanceTimersByTimeAsync(400);
    fireEvent.click(await screen.findByRole("option", { name: /Lagos, Nigeria/ }));
    expect(onChange).toHaveBeenCalledWith({ lat: 6.45, lng: 3.39, text: "Lagos, Nigeria", precision: "city", countryCode3: "NGA", country: "Nigeria", city: "Lagos" });
    expect(document.body.textContent).not.toMatch(/6\.45|3\.39/);
  });

  it("no results shows the country/region hint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ results: [] }))));
    mount();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Nowhereville" } });
    await vi.advanceTimersByTimeAsync(400);
    await waitFor(() => expect(screen.getByText(en.placePicker.noResults)).toBeTruthy());
  });

  it("the search input carries the id the error system focuses", () => {
    mount();
    expect(screen.getByRole("combobox").id).toBe("field-location");
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/place-picker.test.tsx`
Expected: FAIL (no combobox role, no `inputId`, precision chips still rendered).

- [ ] **Step 4: Rewrite `components/forms/place-picker.tsx`**

```tsx
'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RegionChoropleth } from '@/components/maps/region-choropleth'
import { CCM } from '@/lib/ccm-colors'
import { cn } from '@/lib/utils'

export type PlaceValue = {
  lat: number
  lng: number
  text: string
  precision: 'exact' | 'city' | 'country' | 'region'
  countryCode3: string | null
  country?: string | null
  city?: string | null
}

type Suggestion = {
  label: string; lat: number; lng: number; countryCode3: string | null; kind: string
  country: string | null; city: string | null; precision: PlaceValue['precision']
  vx: number | null; vy: number | null
}

/** "Where did this take place?": one search, a preview, and a name. No coordinates, no precision chips. */
export function PlacePicker({
  value,
  onChange,
  inputId = 'place-search',
  describedBy,
  onBlur,
}: {
  value: PlaceValue | null
  onChange: (v: PlaceValue | null) => void
  inputId?: string
  describedBy?: { 'aria-invalid'?: true; 'aria-describedby'?: string }
  onBlur?: () => void
}) {
  const t = useTranslations('placePicker')
  const listId = useId()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const [pin, setPin] = useState<{ vx: number; vy: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(debounce.current)
    if (query.trim().length < 2) { setSuggestions([]); setSearched(false); return }
    debounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setSuggestions(json.results ?? [])
      } catch { setSuggestions([]) }
      finally { setSearching(false); setSearched(true); setActive(0) }
    }, 350)
    return () => clearTimeout(debounce.current)
  }, [query])

  const pick = (s: Suggestion) => {
    onChange({ lat: s.lat, lng: s.lng, text: s.label, precision: s.precision, countryCode3: s.countryCode3, country: s.country, city: s.city })
    setPin(s.vx != null && s.vy != null ? { vx: s.vx, vy: s.vy } : null)
    setSuggestions([]); setSearched(false); setQuery('')
  }

  const open = suggestions.length > 0

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        {!value ? (
          <div className="space-y-1.5">
            <Label htmlFor={inputId}>{t('searchLabel')}</Label>
            <Input
              ref={inputRef}
              id={inputId}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              value={query}
              autoComplete="off"
              placeholder={t('searchPlaceholder')}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={onBlur}
              onKeyDown={(e) => {
                if (!open) return
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, suggestions.length - 1)) }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
                if (e.key === 'Enter') { e.preventDefault(); pick(suggestions[active]) }
                if (e.key === 'Escape') setSuggestions([])
              }}
              {...describedBy}
            />
            {searching && <p className="text-xs text-muted-foreground">{t('searching')}</p>}
            {open && (
              <ul id={listId} role="listbox" className="divide-y rounded-lg border bg-card shadow-sm">
                {suggestions.map((s, i) => (
                  <li key={`${s.lat}-${s.lng}-${i}`} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(s)}
                      className={cn('flex min-h-11 w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-muted', i === active && 'bg-muted')}
                    >
                      <MapPin className="size-4 shrink-0 text-ccm-water" aria-hidden />
                      <span className="min-w-0 flex-1 truncate"><bdi>{s.label}</bdi></span>
                      <span className="shrink-0 text-xs text-muted-foreground">{t(`kind.${s.precision}`)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searched && !searching && !open && <p className="text-sm text-muted-foreground">{t('noResults')}</p>}
            <p className="text-xs text-muted-foreground">{t('hint')}</p>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ccm-amber" aria-hidden />
              <p className="min-w-0 flex-1 text-sm font-medium"><bdi>{value.text}</bdi></p>
              <button
                type="button"
                className="min-h-11 text-sm font-medium text-ccm-water underline-offset-2 hover:underline"
                onClick={() => { onChange(null); setPin(null); requestAnimationFrame(() => inputRef.current?.focus()) }}
              >
                {t('change')}
              </button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${inputId}-name`}>{t('displayLabel')}</Label>
              <Input id={`${inputId}-name`} value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      <div className="relative min-w-0" aria-hidden>
        <RegionChoropleth data={[]} labelFor={() => ''} />
        {pin && value && value.precision !== 'region' && value.precision !== 'country' && (
          <svg viewBox="0 0 960 500" className="pointer-events-none absolute inset-0 h-auto w-full">
            <circle cx={pin.vx} cy={pin.vy} r={8} fill={CCM.amber} stroke="white" strokeWidth={2.5} />
          </svg>
        )}
      </div>
    </div>
  )
}
```

Search the repo for other `PlacePicker` users (`grep -rn "PlacePicker" components app`). If another form passes `defaultPrecision`, remove that prop there; precision now always comes from the result.

- [ ] **Step 5: Run it and confirm it passes**

Run: `npx vitest run lib/__tests__/place-picker.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add components/forms/place-picker.tsx lib/__tests__/place-picker.test.tsx messages/*.json
git commit -m "feat(location): one place search with a preview, no coordinates or precision chips"
```

---

### Task 10: Readers show the place name, never coordinates

**Files:**
- Modify: `lib/content/internal/payload/case-studies.ts` (`caseStudyFragment`: add `locationDisplayText`, `locationText`, `originalLanguage`; `caseStudyDetail`: add `contentLanguage`, the locale the body came from)
- Modify: `types/case-study.ts` (add `locationText?`, `originalLanguage?`, `contentLanguage?` to `CaseStudy`)
- Modify: `lib/case-study-utils.ts` (`getStudyLocationText`)
- Modify: `payload/hooks/search-sync.ts` (location `name`)
- Test: `lib/__tests__/case-study-location-text.test.ts`

**Interfaces:**
- Produces:
  - `getStudyLocationText(caseStudy): string | null` (order: `locationDisplayText` → "city, country" from `locationText` → `studyAreas[0].name` → `null`; never numbers)
  - `caseStudy.contentLanguage: 'en'|'es'|'fr'|'ar'|null`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/case-study-location-text.test.ts
import { describe, expect, it } from "vitest";
import { getStudyLocationText } from "@/lib/case-study-utils";

const base = { studyLocation: { lat: 51.5074, lng: -0.1278 } } as never;

describe("getStudyLocationText", () => {
  it("uses the place name", () => {
    expect(getStudyLocationText({ ...(base as object), locationDisplayText: "London, UK" } as never)).toBe("London, UK");
  });
  it("falls back to city and country", () => {
    expect(getStudyLocationText({ ...(base as object), locationText: { city: "Lagos", country: "Nigeria" } } as never)).toBe("Lagos, Nigeria");
    expect(getStudyLocationText({ ...(base as object), locationText: { country: "Kenya" } } as never)).toBe("Kenya");
  });
  it("never shows coordinates", () => {
    expect(getStudyLocationText(base)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/case-study-location-text.test.ts`
Expected: FAIL (coordinates returned, no `locationDisplayText` branch).

- [ ] **Step 3: Implement**

In `lib/case-study-utils.ts` replace `getStudyLocationText` with:

```ts
export function getStudyLocationText(caseStudy: CaseStudy): string | null {
    const named = caseStudy.locationDisplayText?.trim();
    if (named) return named;
    const { city, country } = caseStudy.locationText ?? {};
    const pair = [city, country].filter((part): part is string => Boolean(part && part.trim())).join(', ');
    if (pair) return pair;
    const area = caseStudy.studyAreas?.find((a) => a.name)?.name;
    return area || null;
}
```

In `types/case-study.ts`, add to `CaseStudy`: `locationText?: { city?: string | null; country?: string | null } | null;`, `originalLanguage?: SupportedLanguage | null;` and `contentLanguage?: SupportedLanguage | null;`.

In `caseStudyFragment` (`lib/content/internal/payload/case-studies.ts`) add, alphabetically placed like its neighbours:

```ts
    locationDisplayText: orNull(text(row.locationDisplayText)),
    locationText: groupOrNull({
      city: orNull(text(row.locationText?.city)),
      country: orNull(text(row.locationText?.country)),
    }),
    originalLanguage: orNull(text(row.originalLanguage)),
```

Add `originalLanguage?: string | null;` to `CaseStudyRow`. Add `locationDisplayText: true, locationText: true, originalLanguage: true` to every `select` object that lists `studyLocation: true` (lines near 719 and 753) so list reads fetch them.

In `caseStudyDetail`, replace the body pick with:

```ts
  const locales = ["originalLanguage" in row && typeof row.originalLanguage === "string" ? row.originalLanguage : "en", "en", "es", "fr", "ar"];
  const contentLanguage = row.content ? locales.find((l) => (row.content as Record<string, unknown>)[l]) ?? null : null;
  const body = contentLanguage ? (row.content as Record<string, unknown>)[contentLanguage] : undefined;
```

and add `contentLanguage` to the returned object.

In `payload/hooks/search-sync.ts`, replace the `studyLocation` `name` with `name: caseStudy.locationDisplayText || [caseStudy.locationText?.city, caseStudy.locationText?.country].filter(Boolean).join(", ") || ""`. If `caseStudy` there has no such fields, add them to the query that loads it in the same file (search for `studyLocation` in the select).

- [ ] **Step 4: Run it and confirm it passes, plus the existing reader tests**

Run: `npx vitest run lib/__tests__/case-study-location-text.test.ts lib/__tests__/content-case-studies.test.ts lib/__tests__/payload-`
Expected: PASS. If a snapshot-style reader test lists the exact keys of a case study, add the three new keys to its expectation.

- [ ] **Step 5: Commit**

```bash
git add lib/case-study-utils.ts types/case-study.ts lib/content/internal/payload/case-studies.ts payload/hooks/search-sync.ts lib/__tests__/
git commit -m "fix(case-studies): readers see the place name, never coordinates"
```

---

### Task 11: Story editor: `#` headings, markdown paste, strikethrough/code kept, code blocks saved

**Files:**
- Create: `components/forms/editor/markdown-paste.ts` (pure `markdownToTiptap(text): JSONContent | null` and `looksLikeMarkdown(text): boolean`)
- Modify: `components/forms/portable-text-editor.tsx` (heading levels `[1,2,3,4]` with level 1 stored as `h2`; paste handler; `language` drives `dir`)
- Modify: `components/forms/editor/pt-convert.ts` (strike ↔ `strike-through`, code ↔ `code`, `codeBlock` ↔ `{ _type: "code", code, language }`; heading level 1 → `h2`)
- Modify: `payload/blocks/rich-text-embeds.ts` (register a `code` embed block: `code` textarea, `language` text)
- Modify: `components/portable-text-renderer.tsx` (inline `code` mark)
- Test: `lib/__tests__/markdown-paste.test.ts`, `lib/__tests__/pt-convert-marks.test.ts`

**Interfaces:**
- Produces: `markdownToTiptap(text: string): { type: "doc"; content: unknown[] } | null` (null when the text doesn't look like markdown), `looksLikeMarkdown(text: string): boolean`

`looksLikeMarkdown` is true only when **at least one line** starts with `#{1,4} `, `- `, `* `, `+ `, `\d+\. `, `> `, or ```` ``` ````, **or** the text contains `**x**`, `__x__`, `[text](http…)`. A `#` or `*` mid-sentence alone never counts.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/markdown-paste.test.ts
import { describe, expect, it } from "vitest";
import { looksLikeMarkdown, markdownToTiptap } from "@/components/forms/editor/markdown-paste";

describe("markdown paste", () => {
  it("prose with symbols stays prose", () => {
    expect(looksLikeMarkdown("We met #3 times and 5 * 3 = 15.")).toBe(false);
    expect(markdownToTiptap("We met #3 times.")).toBeNull();
  });

  it("turns headings, lists, quotes, bold, italic and links into editor blocks", () => {
    const doc = markdownToTiptap("# Title\n## Findings\n- one\n- **two**\n1. first\n> quoted\nSee [the report](https://example.org) and *this*.");
    expect(doc?.content.map((n) => (n as { type: string }).type)).toEqual([
      "heading", "heading", "bulletList", "orderedList", "blockquote", "paragraph",
    ]);
    expect((doc?.content[0] as { attrs: { level: number } }).attrs.level).toBe(2);
    expect((doc?.content[1] as { attrs: { level: number } }).attrs.level).toBe(2);
    expect(JSON.stringify(doc)).toContain('"type":"bold"');
    expect(JSON.stringify(doc)).toContain('"href":"https://example.org"');
    expect(JSON.stringify(doc)).toContain('"type":"italic"');
  });

  it("keeps fenced code as a code block", () => {
    const doc = markdownToTiptap("```python\nprint('hi')\n```");
    expect(doc?.content[0]).toEqual({ type: "codeBlock", attrs: { language: "python" }, content: [{ type: "text", text: "print('hi')" }] });
  });
});
```

```ts
// lib/__tests__/pt-convert-marks.test.ts
import { describe, expect, it } from "vitest";
import { portableTextToTiptap, tiptapToPortableText } from "@/components/forms/editor/pt-convert";

const doc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [
      { type: "text", text: "gone", marks: [{ type: "strike" }] },
      { type: "text", text: "x = 1", marks: [{ type: "code" }] },
    ] },
    { type: "codeBlock", attrs: { language: "r" }, content: [{ type: "text", text: "summary(df)" }] },
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Big" }] },
  ],
};

describe("pt-convert keeps what the editor shows", () => {
  it("round-trips strikethrough, inline code and code blocks", () => {
    const pt = tiptapToPortableText(doc);
    expect(pt[0].children.map((c: { marks: string[] }) => c.marks)).toEqual([["strike-through"], ["code"]]);
    expect(pt[1]).toMatchObject({ _type: "code", code: "summary(df)", language: "r" });
    const back = portableTextToTiptap(pt);
    expect(JSON.stringify(back)).toContain('"type":"strike"');
    expect(JSON.stringify(back)).toContain('"type":"code"');
    expect(back.content[1]).toMatchObject({ type: "codeBlock", attrs: { language: "r" } });
  });

  it("stores a level-1 heading as the page's section heading (h2)", () => {
    expect(tiptapToPortableText(doc)[2].style).toBe("h2");
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run lib/__tests__/markdown-paste.test.ts lib/__tests__/pt-convert-marks.test.ts`
Expected: FAIL (module missing; marks dropped; no codeBlock branch).

- [ ] **Step 3: Implement `markdown-paste.ts`**

```ts
// components/forms/editor/markdown-paste.ts
/** Pasted markdown → TipTap JSON. Only clear markdown is converted; ordinary prose is left alone. */

type Mark = { type: "bold" | "italic" | "code" | "strike" | "link"; attrs?: { href: string } };
type Inline = { type: "text"; text: string; marks?: Mark[] };
type Block = { type: string; attrs?: Record<string, unknown>; content?: unknown[] };

const BLOCK_START = /^(#{1,4}\s|[-*+]\s|\d+\.\s|>\s?|```)/;
const INLINE = /\*\*[^*\n]+\*\*|__[^_\n]+__|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)/;

export function looksLikeMarkdown(text: string): boolean {
  return text.split(/\r?\n/).some((line) => BLOCK_START.test(line.trimStart())) || INLINE.test(text);
}

const TOKEN = /(\*\*([^*\n]+)\*\*|__([^_\n]+)__|~~([^~\n]+)~~|`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)|\*([^*\n]+)\*|_([^_\n]+)_)/g;

function inline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index! > last) out.push({ type: "text", text: text.slice(last, m.index) });
    if (m[2] || m[3]) out.push({ type: "text", text: m[2] ?? m[3], marks: [{ type: "bold" }] });
    else if (m[4]) out.push({ type: "text", text: m[4], marks: [{ type: "strike" }] });
    else if (m[5]) out.push({ type: "text", text: m[5], marks: [{ type: "code" }] });
    else if (m[6]) out.push({ type: "text", text: m[6], marks: [{ type: "link", attrs: { href: m[7] } }] });
    else out.push({ type: "text", text: m[8] ?? m[9], marks: [{ type: "italic" }] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out.filter((node) => node.text.length > 0);
}

const paragraph = (text: string): Block => ({ type: "paragraph", content: inline(text) });

export function markdownToTiptap(text: string): { type: "doc"; content: Block[] } | null {
  if (!looksLikeMarkdown(text)) return null;
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const content: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    const fence = trimmed.match(/^```(\w*)/);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++;
      content.push({ type: "codeBlock", attrs: { language: fence[1] || null }, content: code.length ? [{ type: "text", text: code.join("\n") }] : [] });
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      content.push({ type: "heading", attrs: { level: Math.max(2, heading[1].length) }, content: inline(heading[2]) });
      i++;
      continue;
    }

    const listKind = /^[-*+]\s/.test(trimmed) ? "bulletList" : /^\d+\.\s/.test(trimmed) ? "orderedList" : null;
    if (listKind) {
      const items: Block[] = [];
      const pattern = listKind === "bulletList" ? /^[-*+]\s+(.*)$/ : /^\d+\.\s+(.*)$/;
      while (i < lines.length && pattern.test(lines[i].trim())) {
        items.push({ type: "listItem", content: [paragraph(lines[i].trim().match(pattern)![1])] });
        i++;
      }
      content.push({ type: listKind, content: items });
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoted: Block[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoted.push(paragraph(lines[i].trim().replace(/^>\s?/, "")));
        i++;
      }
      content.push({ type: "blockquote", content: quoted });
      continue;
    }

    content.push(paragraph(trimmed));
    i++;
  }
  return { type: "doc", content };
}
```

- [ ] **Step 4: Update `pt-convert.ts`**

- In the span conversion (around line 44), add: `else if (mark.type === "strike") marks.push("strike-through"); else if (mark.type === "code") marks.push("code");`
- In the reverse mark mapping (around line 307), add: `else if (mark === "strike-through") marks.push({ type: "strike" }); else if (mark === "code") marks.push({ type: "code" });`
- Add `1: "h2"` to `BLOCK_STYLE_BY_HEADING_LEVEL`.
- In `tiptapToPortableText`, add a branch before the unknown-node fallthrough:

```ts
    } else if (node.type === "codeBlock") {
      const code = (node.content ?? []).map((child: AnyNode) => child.text ?? "").join("");
      portableText.push({ _type: "code", _key: uuidv4(), code, ...(node.attrs?.language ? { language: node.attrs.language } : {}) });
```

- In `portableTextToTiptap`, add a branch for `block._type === "code"` that pushes `{ type: "codeBlock", attrs: { language: block.language ?? null }, content: block.code ? [{ type: "text", text: block.code }] : [] }`.

- [ ] **Step 5: Update the editor**

In `portable-text-editor.tsx`:
- `StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } })`.
- Add to `useEditor`:

```ts
        editorProps: {
            handlePaste: (view, event) => {
                const text = event.clipboardData?.getData('text/plain') ?? '';
                const hasHtml = Boolean(event.clipboardData?.getData('text/html'));
                if (hasHtml) return false;
                const doc = markdownToTiptap(text);
                if (!doc) return false;
                editorRef.current?.chain().focus().insertContent(doc.content).run();
                return true;
            },
        },
```

  Keep a ref (`const editorRef = useRef<Editor | null>(null)`) set right after `useEditor` returns (`editorRef.current = editor`), since `handlePaste` runs before `editor` is in scope. Import `markdownToTiptap` from `./editor/markdown-paste`. If the editor already has `editorProps`, merge `handlePaste` into it.
- `isRTL` already follows `language`. The form (Task 14) passes the writing language instead of the page locale. Also set `lang={language}` on the editor wrapper element.

- [ ] **Step 6: Register the `code` embed and render inline code**

In `payload/blocks/rich-text-embeds.ts`, add next to the other embed blocks and include it in `richTextEmbedBlocks`:

```ts
const codeBlock: Block = {
  slug: "code",
  labels: { singular: "Code", plural: "Code" },
  fields: [
    { name: "code", type: "textarea", required: true },
    { name: "language", type: "text" },
  ],
};
```

(Follow the exact typing and export pattern the other blocks in that file use.)

In `components/portable-text-renderer.tsx` `marks`, add: `code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>,`

- [ ] **Step 7: Run the tests, the existing editor/lexical tests, and confirm pass**

Run: `npx vitest run lib/__tests__/markdown-paste.test.ts lib/__tests__/pt-convert-marks.test.ts lib/__tests__/payload-page-blocks.test.ts`
Also run: `npx vitest run $(ls lib/__tests__/*pt*.test.ts lib/__tests__/*lexical*.test.ts 2>/dev/null)`
Expected: PASS.

- [ ] **Step 8: Regenerate the admin import map and check /admin**

Run: `pnpm exec payload generate:importmap`, then `pnpm dev` and `curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/admin`.
Expected: `200`.

- [ ] **Step 9: Commit**

```bash
git add components/forms/editor/ components/forms/portable-text-editor.tsx payload/blocks/rich-text-embeds.ts components/portable-text-renderer.tsx "app/(payload)/admin/importMap.js" lib/__tests__/markdown-paste.test.ts lib/__tests__/pt-convert-marks.test.ts
git commit -m "feat(editor): # headings, markdown paste, and strikethrough, code and code blocks that survive saving"
```

---

### Task 12: Saving: language, place, region and cover image; drafts keep everything

**Files:**
- Modify: `lib/content/case-studies.ts` (`CaseStudyInput`: add `originalLanguage`, `imageAssetId`; `topic` optional and unused; `place` gains `country`/`city`; `submitCaseStudy` computes `region`)
- Modify: `lib/content/internal/payload/case-studies.ts` (`CaseStudyDraft`, `payloadData`, `createCaseStudy`, `updateCaseStudySubmission`, `draftPayloadData`, `DRAFT_FIELDS`, `draftDocument`, new `findCommunityRegion`, new `saveSubmissionEdits`)
- Test: extend `lib/__tests__/content-case-studies.test.ts`

**Interfaces:**
- Consumes: `deriveRegion` (Task 8), Task 7 fields.
- Produces:
  - `submitCaseStudy(input: CaseStudyInput)` (same signature; new optional fields `originalLanguage`, `imageAssetId`)
  - `payloadCaseStudies.findCommunityRegion(id: string): Promise<string | null>`
  - `saveSubmissionEdits(userId: string, id: string, data: Record<string, unknown>): Promise<void>`: autosave of an in-review case study. It checks ownership like `loadExistingCaseStudy` + `editable`, writes fields through `payloadData` **without** changing `moderationStatus`, and throws `CaseStudyEditNotAllowedError` otherwise.

Write rules:
- **Create:**
  - `createDocument` with `locale: originalLanguage`, and data `{ ...payloadData(draft), title: title[lang], excerpt: excerpt[lang], content: portableTextToLexical(content), originalLanguage, region, locationText: { country: place.country, city: place.city } }`.
  - Then, if `lang !== "en"`, `updateDocument` with `locale: "en"` and `{ title: title.en, excerpt: excerpt.en }`.
  - Then mirror optional translations for the remaining locales, title and excerpt only, skipping `lang` and `en`.
- **`region`** = `deriveRegion({ communityRegion: await findCommunityRegion(relatedCommunity), countryCode3: place?.countryCode3 })`. Omitted when null.
- **`imageAssetId`** given → `image: { asset: imageAssetId, alt }`, and no upload. Otherwise the existing upload path runs.
- **`topic`** is never written.
- **Drafts:**
  - `DRAFT_FIELDS` gains `"place"`, `"originalLanguage"` and `"imageAssetId"`.
  - `draftPayloadData` maps `place` → `studyLocation`, `locationDisplayText`, `locationPrecision`, `locationCountryCode` and `locationText { country, city }`.
  - `originalLanguage` → `contentLanguage`.
  - `imageAssetId` → `image: { asset: imageAssetId }`.
  - `draftDocument` returns `place` rebuilt from those columns (when `studyLocation` and `locationDisplayText` exist), `originalLanguage` (from `contentLanguage`), and `imageAssetId` plus `imageUrl` (from `row.image.asset`).
  - Title and excerpt mirroring from the earlier fix stays.

- [ ] **Step 1: Write the failing tests** (add inside the existing Payload `describe` blocks of `content-case-studies.test.ts`, reusing its mocks `mockPayloadCreate`, `mockPayloadUpdate`, `mockPayloadQueryRaw`):

```ts
    it("an Arabic original is created in Arabic, with the English title written to English", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [] } as never);
      mockPayloadCreate.mockResolvedValue({ id: "cs-ar" } as never);
      await submitCaseStudy({
        userId: "u1",
        originalLanguage: "ar",
        title: { ar: "فيضانات لاغوس", en: "Lagos floods" },
        excerpt: { ar: "ب".repeat(50), en: "E".repeat(20) },
        content: [{ _type: "block", children: [{ _type: "span", text: "قصة" }] }],
        authors: [{ name: "A" }],
        tags: ["theme-1"],
        place: { lat: 6.45, lng: 3.39, text: "Lagos, Nigeria", precision: "city", countryCode3: "NGA", country: "Nigeria", city: "Lagos" },
      } as never);
      const [{ locale, data }] = mockPayloadCreate.mock.calls[0] as [{ locale: string; data: Record<string, unknown> }];
      expect(locale).toBe("ar");
      expect(data).toMatchObject({ title: "فيضانات لاغوس", originalLanguage: "ar", region: "ssa", locationText: { country: "Nigeria", city: "Lagos" } });
      expect(data).not.toHaveProperty("topic");
      expect(mockPayloadUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "cs-ar", locale: "en", data: { title: "Lagos floods", excerpt: "E".repeat(20) } }));
    });

    it("region comes from the community when there is one", async () => {
      mockPayloadQueryRaw.mockImplementation(async (d: { collection: string }) =>
        (d.collection === "regionalCommunities" ? { docs: [{ id: "c1", region: "oce" }] } : { docs: [] }) as never);
      mockPayloadCreate.mockResolvedValue({ id: "cs-c" } as never);
      await submitCaseStudy({ userId: "u1", title: { en: "Pacific study" }, excerpt: { en: "x".repeat(50) }, content: [], authors: [{ name: "A" }], tags: [], relatedCommunity: "c1" } as never);
      const [{ data }] = mockPayloadCreate.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(data.region).toBe("oce");
    });

    it("reuses a cover image uploaded while drafting instead of uploading again", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [] } as never);
      mockPayloadCreate.mockResolvedValue({ id: "cs-i" } as never);
      await submitCaseStudy({ userId: "u1", title: { en: "With image" }, content: [], authors: [{ name: "A" }], tags: [], imageAssetId: "media-9" } as never);
      const [{ data }] = mockPayloadCreate.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(data.image).toMatchObject({ asset: "media-9" });
      expect(mockPayloadImageUpload).not.toHaveBeenCalled();
    });

    it("draft round-trip keeps language, place and image", async () => {
      mockPayloadCreate.mockResolvedValue({ id: "d-1" } as never);
      const place = { lat: 6.45, lng: 3.39, text: "Lagos, Nigeria", precision: "city", countryCode3: "NGA", country: "Nigeria", city: "Lagos" };
      await saveCaseStudyDraft("u1", undefined, { originalLanguage: "ar", place, imageAssetId: "media-9" });
      const [{ data }] = mockPayloadCreate.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(data).toMatchObject({
        contentLanguage: "ar",
        locationDisplayText: "Lagos, Nigeria",
        locationPrecision: "city",
        locationCountryCode: "NGA",
        locationText: { country: "Nigeria", city: "Lagos" },
        image: { asset: "media-9" },
      });
      mockPayloadQueryRaw.mockResolvedValue({ docs: [{ id: "d-1", userId: "u1", ...data, studyLocation: [3.39, 6.45], image: { asset: { id: "media-9", url: "/m.jpg" } } }] } as never);
      const reopened = await getCaseStudyDraftById("u1", "d-1");
      expect(reopened).toMatchObject({ originalLanguage: "ar", place: { text: "Lagos, Nigeria", precision: "city", countryCode3: "NGA", country: "Nigeria", city: "Lagos" }, imageAssetId: "media-9" });
    });
```

(Check the Payload `point` storage shape in the existing `geopoint()` helper and use the same in the fixture: `[lng, lat]`. Add `getCaseStudyDraftById` to the test file's import from `@/lib/content/case-studies` if it's missing.)

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run lib/__tests__/content-case-studies.test.ts`
Expected: the four new tests FAIL.

- [ ] **Step 3: Implement**

`lib/content/internal/payload/case-studies.ts`:

```ts
export async function findCommunityRegion(id: string): Promise<string | null> {
  const result = await queryRaw<Paginated<{ id?: unknown; region?: unknown }>>({
    type: "find",
    collection: "regionalCommunities",
    where: { id: { equals: id } },
    limit: 1,
    depth: 0,
  });
  return text(result.docs[0]?.region) ?? null;
}
```

In `CaseStudyDraft` add `originalLanguage?: string; region?: string; placeCountry?: string; placeCity?: string; imageAssetId?: string` (keep existing fields). In `payloadData`: stop writing `title`/`excerpt`/`content` there. Instead `createCaseStudy` and `updateCaseStudySubmission` write them per locale as described above. Add `originalLanguage`, `region` and `locationText: { country: draft.placeCountry ?? null, city: draft.placeCity ?? null }` when a place was given. Remove `topic` from `data`.

`createCaseStudy(draft, meta)`:

```ts
  const lang = (draft.originalLanguage ?? "en") as PayloadLocale;
  const created = await createDocument({
    collection: "caseStudies",
    locale: lang,
    draft: false,
    data: {
      ...payloadData(draft),
      title: draft.title[lang] ?? "",
      ...(draft.excerpt?.[lang] ? { excerpt: draft.excerpt[lang] } : {}),
      content: portableTextToLexical(draft.content),
      id: meta.id, slug: meta.slug, submittedBy: meta.submittedBy, submittedAt: meta.submittedAt,
    },
  });
  if (lang !== "en") {
    await updateDocument({ collection: "caseStudies", id: created.id, locale: "en", data: { title: draft.title.en ?? "", excerpt: draft.excerpt?.en ?? "" } });
  }
  await mirrorSubmissionLocales(created.id, draft, lang);
  return created;
```

Change `mirrorSubmissionLocales(id, draft, skip)` to loop `["en","es","fr","ar"]`, skipping `skip` and (when `skip !== "en"`) `"en"`. `updateCaseStudySubmission` does the same three writes, using `updateDocument` for the first.

`saveSubmissionEdits(userId, id, data)` goes in `lib/content/case-studies.ts`. It loads via `payloadCaseStudies.loadExistingCaseStudy(id)`, applies the same `editable`/`isSubmitter`/workspace check `submitCaseStudy` uses (extract that check into a local `assertCanEdit(existing, userId)` and call it from both), then calls `payloadCaseStudies.updateCaseStudySubmission(id, draftFrom(data))` with a version that **does not** set `moderationStatus`. Add a parameter `{ keepStatus: true }` to `payloadData` that omits `moderationStatus` and `featured`.

`lib/content/case-studies.ts` `submitCaseStudy`:
- Build `draft` with `originalLanguage: input.originalLanguage ?? "en"`, `placeCountry: input.place?.country ?? undefined`, `placeCity: input.place?.city ?? undefined`.
- Compute `region = deriveRegion({ communityRegion: input.relatedCommunity ? await payloadCaseStudies.findCommunityRegion(input.relatedCommunity) : null, countryCode3: input.place?.countryCode3 })` and set `draft.region = region ?? undefined`.
- When `input.imageAssetId` is set, skip the upload and set `draft.imageAssetId`.
- Delete `topic` from `CaseStudyInput` usage (`topic: input.topic || "other"` lines on both arms). The Sanity arm keeps `topic: "other"` only if its schema still requires it; the Payload arm drops it.

Drafts: implement the `DRAFT_FIELDS`, `draftPayloadData` and `draftDocument` rules listed under **Write rules** above.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run lib/__tests__/content-case-studies.test.ts lib/__tests__/case-study-drafts-route.test.ts`
Expected: PASS, including the older tests. Where an older test asserted `topic` on the created data or `locale: "en"` for an English submission, keep English behaviour identical (English originals still create with `locale: "en"`), and delete only assertions about `topic`.

- [ ] **Step 5: Commit**

```bash
git add lib/content/case-studies.ts lib/content/internal/payload/case-studies.ts lib/__tests__/content-case-studies.test.ts
git commit -m "feat(case-studies): save in the writer's language, set region from the place, and drafts keep place and image"
```

---

### Task 13: Tags replace Topic in loaders, picker and list filter

**Files:**
- Modify: `lib/content/case-studies.ts` + `lib/content/internal/payload/case-studies.ts` (`CaseStudyTagOption` gains `category`; `CaseStudyCommunityOption` gains `region`)
- Create: `components/forms/case-study/tag-picker.tsx`
- Create: `lib/case-studies/main-theme.ts`
- Modify: `components/case-studies/case-studies-filters.tsx`, `app/[locale]/(main)/research-and-action/case-studies/page.tsx` (Topic filter → theme tags; `?topic=` mapped)
- Modify: `components/blocks/grid/grid-case-study.tsx`, `components/dashboard/user-submissions-dashboard.tsx` (show the main theme where `topic` was shown)
- Modify: `messages/{en,es,fr,ar}.json` (`caseStudySubmission.tags`)
- Test: `lib/__tests__/tag-picker.test.tsx`, `lib/__tests__/main-theme.test.ts`

**Interfaces:**
- Produces:
  - `TAG_GROUPS = ["topic", "audience", "impact", "method", "other"] as const` (the `location` group is excluded)
  - `TagPicker({ tags, selected, onChange, inputId, describedBy, onBlur })`, where `tags: Array<{ _id: string; label?: Localized; category?: string | null }>`
  - `mainTheme<T extends { category?: string | null }>(tags: T[]): T | null`: the first tag in `tags` order whose category is `topic`

- [ ] **Step 1: Strings** (add under `caseStudySubmission` in each locale):
  - en: `"tags": { "heading": "Tags", "hint": "Pick at least one theme. Your first theme is the main one.", "search": "Search tags…", "noMatch": "No tags match. Suggest a new one below.", "groups": { "topic": "Themes", "audience": "Who it affects", "impact": "Impact", "method": "Approach", "other": "Other" }, "main": "Main theme", "remove": "Remove {tag}" }`
  - es: `"tags": { "heading": "Etiquetas", "hint": "Elige al menos un tema. El primero que elijas será el principal.", "search": "Buscar etiquetas…", "noMatch": "Ninguna etiqueta coincide. Sugiere una nueva abajo.", "groups": { "topic": "Temas", "audience": "A quién afecta", "impact": "Impacto", "method": "Enfoque", "other": "Otras" }, "main": "Tema principal", "remove": "Quitar {tag}" }`
  - fr: `"tags": { "heading": "Étiquettes", "hint": "Choisissez au moins un thème. Le premier choisi sera le thème principal.", "search": "Rechercher des étiquettes…", "noMatch": "Aucune étiquette ne correspond. Suggérez-en une ci-dessous.", "groups": { "topic": "Thèmes", "audience": "Qui est concerné", "impact": "Impact", "method": "Approche", "other": "Autres" }, "main": "Thème principal", "remove": "Retirer {tag}" }`
  - ar: `"tags": { "heading": "الوسوم", "hint": "اختر موضوعًا واحدًا على الأقل. أول موضوع تختاره هو الموضوع الرئيسي.", "search": "ابحث في الوسوم…", "noMatch": "لا توجد وسوم مطابقة. اقترح وسمًا جديدًا أدناه.", "groups": { "topic": "المواضيع", "audience": "من يتأثر", "impact": "الأثر", "method": "النهج", "other": "أخرى" }, "main": "الموضوع الرئيسي", "remove": "إزالة {tag}" }`

- [ ] **Step 2: Write the failing tests**

```ts
// lib/__tests__/main-theme.test.ts
import { describe, expect, it } from "vitest";
import { mainTheme } from "@/lib/case-studies/main-theme";

describe("mainTheme", () => {
  it("is the first theme tag in pick order", () => {
    expect(mainTheme([{ id: "a", category: "audience" }, { id: "b", category: "topic" }, { id: "c", category: "topic" }])?.id).toBe("b");
  });
  it("is empty without a theme", () => {
    expect(mainTheme([{ id: "a", category: "impact" }])).toBeNull();
  });
});
```

```tsx
// lib/__tests__/tag-picker.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import { TagPicker } from "@/components/forms/case-study/tag-picker";

afterEach(() => cleanup());
const tags = [
  { _id: "t1", label: { en: "Water Access" }, category: "topic" },
  { _id: "t2", label: { en: "Farmers" }, category: "audience" },
  { _id: "t3", label: { en: "Sub-Saharan Africa" }, category: "location" },
  { _id: "t4", label: { en: "Storms" }, category: "topic" },
];

function mount(selected: string[] = [], onChange = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={{ caseStudySubmission: en.caseStudySubmission }}>
      <TagPicker tags={tags} selected={selected} onChange={onChange} inputId="field-tags" />
    </NextIntlClientProvider>,
  );
  return onChange;
}

describe("TagPicker", () => {
  it("groups tags under plain headings and hides region tags", () => {
    mount();
    expect(screen.getByText("Themes")).toBeTruthy();
    expect(screen.getByText("Who it affects")).toBeTruthy();
    expect(screen.queryByText("Sub-Saharan Africa")).toBeNull();
  });

  it("filters across groups as you type", () => {
    mount();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "sto" } });
    expect(screen.getByRole("button", { name: "Storms" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Farmers" })).toBeNull();
  });

  it("adds in pick order and marks the main theme", () => {
    const onChange = mount(["t2", "t4"]);
    expect(screen.getByText("Main theme")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Water Access" }));
    expect(onChange).toHaveBeenCalledWith(["t2", "t4", "t1"]);
  });
});
```

- [ ] **Step 3: Run them and confirm they fail**

Run: `npx vitest run lib/__tests__/main-theme.test.ts lib/__tests__/tag-picker.test.tsx`
Expected: FAIL, because the modules are missing.

- [ ] **Step 4: Implement**

```ts
// lib/case-studies/main-theme.ts
/** The first chosen tag whose category is `topic` — shown where the retired Topic used to be. */
export function mainTheme<T extends { category?: string | null }>(tags: T[]): T | null {
  return tags.find((tag) => tag.category === "topic") ?? null;
}
```

```tsx
// components/forms/case-study/tag-picker.tsx
"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const TAG_GROUPS = ["topic", "audience", "impact", "method", "other"] as const;
type TagOption = { _id: string; label?: Record<string, string | null | undefined> | null; category?: string | null };

export function TagPicker({
  tags,
  selected,
  onChange,
  inputId,
  describedBy,
  onBlur,
}: {
  tags: TagOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  inputId: string;
  describedBy?: { "aria-invalid"?: true; "aria-describedby"?: string };
  onBlur?: () => void;
}) {
  const t = useTranslations("caseStudySubmission.tags");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const label = (tag: TagOption) => tag.label?.[locale] || tag.label?.en || "";
  const byId = useMemo(() => new Map(tags.map((tag) => [tag._id, tag])), [tags]);
  const firstTheme = selected.find((id) => byId.get(id)?.category === "topic");
  const q = query.trim().toLocaleLowerCase(locale);

  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const groups = TAG_GROUPS.map((group) => ({
    group,
    items: tags
      .filter((tag) => (tag.category ?? "other") === group || (group === "other" && !TAG_GROUPS.includes((tag.category ?? "") as never) && tag.category !== "location"))
      .filter((tag) => !q || label(tag).toLocaleLowerCase(locale).includes(q))
      .sort((a, b) => label(a).localeCompare(label(b), locale)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4" onBlur={onBlur}>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const tag = byId.get(id);
            if (!tag) return null;
            return (
              <li key={id} className="flex min-h-9 items-center gap-1.5 rounded-full bg-ccm-midnight px-3 text-sm text-white">
                {id === firstTheme && <Star className="size-3.5 fill-current" aria-label={t("main")} />}
                <span>{label(tag)}</span>
                <button type="button" className="-me-1 grid size-7 place-items-center rounded-full hover:bg-white/15" onClick={() => toggle(id)} aria-label={t("remove", { tag: label(tag) })}>
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {firstTheme && <p className="text-xs text-muted-foreground">★ {t("main")}: {label(byId.get(firstTheme)!)}</p>}

      <Input id={inputId} type="search" role="searchbox" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} {...describedBy} />

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noMatch")}</p>
      ) : (
        groups.map(({ group, items }) => (
          <fieldset key={group}>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(`groups.${group}`)}</legend>
            <div className="flex flex-wrap gap-2">
              {items.map((tag) => {
                const on = selected.includes(tag._id);
                return (
                  <button
                    key={tag._id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(tag._id)}
                    className={cn(
                      "min-h-11 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water",
                      on ? "border-ccm-midnight bg-ccm-midnight text-white" : "border-border bg-background hover:border-ccm-water",
                    )}
                  >
                    {label(tag)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))
      )}
    </div>
  );
}
```

Note: the "Main theme" chip marker uses `aria-label` on the star; the text line under the chips uses `t("main")`, which the test finds.

Loaders: in `getAvailableCaseStudyTags` (Payload arm) add `category: orNull(text(tag.category))`. In `getActiveCaseStudyCommunities` add `region: orNull(text(row.region))`. Extend the interfaces with `category?: string | null` and `region?: string | null`.

List filter:
- In `case-studies-filters.tsx`, remove the `topicOptions` import and the Topic group.
- Rename the tags group label to `t('themes')`. Add `"themes"` to `caseStudies.filters` in all four locales: en "Themes", es "Temas", fr "Thèmes", ar "المواضيع".
- In `page.tsx`, when `topics` is present in the URL, convert each value through a `LEGACY_TOPIC_TO_TAG` map built from the confirmed conversion table (Task 16). Until then, ignore unknown topics. Pass the converted ids into `tags`.

Cards and dashboard: replace the topic label with `mainTheme(caseStudy.tags ?? [])?.label` localized. Remove the `enumLabel(..., 'topics')` calls there.

News filters (`components/news/news-filters.tsx`):
- Trace what its Topic group filters: `topicOptions` → the URL parameter → `app/[locale]/(main)/news/page.tsx` → the news reader.
- News posts have no `topic` field (`grep -n '"topic"' payload/collections/news-posts.ts` prints nothing). So if the group filters on `topic`, it matches nothing: remove the group and its `topicOptions` import.
- If it filters on something else, leave it.
- Say which case applied in the commit message.

Confirm case studies' `themes`/`populations` are unused by case study readers:
- Run `grep -rn "themes\|populations" "app/[locale]/(main)/research-and-action/case-studies" components/case-studies components/blocks/grid/grid-case-study.tsx lib/content/internal/payload/case-studies.ts`.
- No hits → leave them alone (spec §9).
- Hits → stop and report them to the user; don't change them in this plan.

- [ ] **Step 5: Run the tests, then a type check**

Run: `npx vitest run lib/__tests__/main-theme.test.ts lib/__tests__/tag-picker.test.tsx && npx tsc --noEmit -p .`
Expected: tests PASS; tsc prints nothing.

- [ ] **Step 6: Commit**

```bash
git add components/forms/case-study/tag-picker.tsx lib/case-studies/main-theme.ts lib/content/ components/case-studies/case-studies-filters.tsx "app/[locale]/(main)/research-and-action/case-studies/page.tsx" components/blocks/grid/grid-case-study.tsx components/dashboard/user-submissions-dashboard.tsx messages/*.json lib/__tests__/main-theme.test.ts lib/__tests__/tag-picker.test.tsx
git commit -m "feat(tags): a searchable, grouped tag picker; themes replace the fixed topic list"
```

---

### Task 14: The case study form, rebuilt

**Files:**
- Create: `components/forms/case-study/writing-language.tsx`
- Create: `components/forms/case-study/story-section.tsx`
- Create: `components/forms/case-study/people-section.tsx`
- Create: `components/forms/case-study/where-section.tsx`
- Create: `components/forms/case-study/use-case-study-draft.ts`
- Rewrite: `components/forms/case-study-form.tsx`
- Modify: `components/forms/case-study/byline-chips.tsx` (show per-author errors; label "Who wrote this?")
- Modify: `components/forms/case-study/submit-bar.tsx` (becomes `DraftStatusLine` + action buttons used inside `WhatsLeft`; the sticky bar is removed)
- Modify: `messages/{en,es,fr,ar}.json` (`caseStudySubmission` wording: listed per step)
- Test: `lib/__tests__/case-study-form.test.tsx`

**Interfaces:**
- Consumes: everything in Tasks 1–13: `useFormErrors`, `FieldError`, `fieldId`, `WhatsLeft`, `makeCaseStudySubmissionSchema`, `caseStudyFieldOrder`, `hasStoryText`, `CASE_STUDY_MINIMUMS`, `PlacePicker`, `TagPicker`, `mainTheme`, `readFormError`, `localeHeaders`, `toFieldIssues`.
- Produces: the default export `ImprovedCaseStudyForm` with the same props as today, where `availableTags[]` now carries `category` and `regionalCommunities[]` carries `region`.

**Form state (single object `values`):**

```ts
type CaseStudyValues = {
  originalLanguage: WritingLanguage;
  title: Partial<Record<WritingLanguage, string>>;
  excerpt: Partial<Record<WritingLanguage, string>>;
  content: unknown[];
  authors: Array<{ name: string; email?: string; role: AuthorRole }>;
  organizationName: string;
  place: PlaceValue | null;
  relatedCommunity: string;
  studyPeriod: { startDate: string; endDate: string };
  tags: string[];
  suggestedTags: string[];
  layout: CaseStudyLayout;
  imageAssetId?: string;
  imageUrl?: string;
};
```

**Behaviour:**
- `validate = (v) => { const r = schema.safeParse(v); return r.success ? [] : toFieldIssues(r.error); }`, with `schema = makeCaseStudySubmissionSchema({ themeTagIds })` memoised from `availableTags` whose `category === "topic"`.
- `useFormErrors({ values, validate, t: tErrors, order: caseStudyFieldOrder(values.originalLanguage, values.authors.length) })`, where `tErrors = useTranslations("forms.errors")`.
- Every input gets `id={fieldId(path)}`, `onBlur={() => leave(path)}`, `{...describedBy(path)}` and a `<FieldError path message={errors[path]} />` under it.
- **Preview / Submit:** `if (!validateAll()) { focusFirstError(); return; }`. No toast.
- **Submit request:** `fetch("/api/case-studies/submit", { method: "POST", headers: localeHeaders(locale), body })`. On `!ok`: `const { message, fields } = await readFormError(res, tErrors("form.generic")); setServerErrors(fields); setFormMessage(message); focusFirstError();`. A `formMessage` banner renders above "Your story" with `role="alert"`.
- **Cover image:** on choose, validate type/size client-side with `upload.wrongType` / `upload.tooBig` (size in MB with one decimal, max 5). Then POST to `/api/uploads/image` (FormData `file`) and store the returned `id` → `imageAssetId` and `url` → `imageUrl`. On failure show `readFormError`'s message under the drop zone.
- **Location:** `WhereSection` passes `inputId={fieldId("location")}` to `PlacePicker`. On `place` change with a `countryCode3`, if exactly one community has `region === isoToRegion(countryCode3)` and `relatedCommunity` is empty, preselect it.
- **Writing language:** `WritingLanguage` sets `values.originalLanguage`. Title, summary and story use `dir={lang === "ar" ? "rtl" : "ltr"}` and `lang={lang}`, and the editor gets `language={lang}`. When `lang !== "en"`, render "English title" and "One-line English summary" (ids `field-title-en` / `field-excerpt-en`). "Add translations" is a `<details>` with the title and summary inputs for the remaining two languages.
- **What's left items** (labels from `caseStudySubmission.whatsLeft.*`):
  - `title`: done when `title[lang]` ≥ 5, target `title.<lang>`
  - `summary`: done when `excerpt[lang]` ≥ 50, target `excerpt.<lang>`
  - `story`: done when `hasStoryText(content)`, target `content`
  - `englishTitle` (only when lang ≠ en): done when `title.en` ≥ 5
  - `englishSummary` (only when lang ≠ en): done when `excerpt.en` ≥ 20
  - `authors`: done when ≥ 1 author has a name
  - `theme`: done when a selected tag is a theme, target `tags`
  - `where`: done when `place || relatedCommunity`, target `location`
  - nudge `pin`: shown when `!place && relatedCommunity`, target `location`
- **Drafts** (`use-case-study-draft.ts`):
  - Debounced 1.5 s POST to `/api/case-studies/drafts` with `{ draftId, draftData: values }` and `localeHeaders`.
  - In edit mode (`editDoc`), POST `{ editId: editDoc._sanityId, draftData: values }` to the same route (Task 15 adds this branch).
  - Mirrors `values` to `localStorage["case-study-draft:" + (draftId ?? "new")]` with a `savedAt` timestamp on every change.
  - On load, a local copy newer than the server draft's `lastSaved` shows a banner, "Restore your unsaved changes?", with Restore / Discard.
  - Status text: `saving` → "Saving…", `saved` → "Saved · {time}", `error` → "Couldn't save — we'll keep trying. Your text is safe on this device."
- **Presentation** (`LayoutChooser`) moves to the end, heading "How should it look?".
- **Removed:** the topic select, the country/city inputs, "Find on map", the coordinate readouts, the 4-language switcher, `REQUIRED_SECTIONS`/`completedSections`, `makeFormSchema`, `geocodeLocation`, `topicOptions` and `enumLabel` imports.

**Wording to add under `caseStudySubmission`** (all four locales; English shown; translate the other three in the same register as Task 1's messages):
- `sections`: `{ "writingIn": "I'm writing in", "story": "Your story", "people": "Who wrote this?", "where": "Where & when", "tags": "Tags", "presentation": "How should it look?" }`
- `fields`: `{ "title": "Title", "summary": "Summary", "summaryHint": "One or two sentences about what happened ({min}+ characters)", "story": "Your story", "englishTitle": "English title", "englishSummary": "One-line English summary", "englishHint": "So the English site and search can list your case study.", "translations": "Add translations (optional)", "dates": "When did this happen?", "start": "Started", "end": "Ended (leave empty if ongoing)", "organisation": "Organisation (optional)" }`
- `whatsLeft`: `{ "title": "Add a title", "summary": "Write a short summary (at least {min} characters)", "story": "Write your story", "englishTitle": "Add an English title", "englishSummary": "Add a one-line English summary", "authors": "Add who wrote this", "theme": "Choose at least one theme", "where": "Add where this took place", "pin": "Add a specific place so this appears as a pin on the map — without one it only shows on the community's page" }`
- `draft`: `{ "saving": "Saving…", "savedAt": "Saved · {time}", "error": "Couldn't save — we'll keep trying. Your text is safe on this device.", "restorePrompt": "Restore your unsaved changes from {time}?", "restore": "Restore", "discard": "Discard" }`

Delete keys no longer referenced (`languages.*`, `details.topic*`, `details.country*`, `details.city*`, `details.findOnMap`, `details.coordsFound`, `details.searching`, `toasts.locationFound`, `toasts.searchingLocation`, `toasts.locationNotFound`, `toasts.fixErrors`, `toasts.fixBeforeReview`, `validation.*`). Check each with `grep -rn "<key>" components app lib` before deleting.

- [ ] **Step 1: Write the failing test**

```tsx
// lib/__tests__/case-study-form.test.tsx
// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: { fullName: "Ada Lovelace", emailAddresses: [{ emailAddress: "ada@example.org" }] } }) }));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/forms/portable-text-editor", () => ({
  default: ({ onChangeAction, language, id }: { onChangeAction: (v: unknown) => void; language: string; id?: string }) => (
    <textarea
      id={id}
      data-testid="story"
      data-language={language}
      onChange={(e) => onChangeAction([{ _type: "block", children: [{ _type: "span", text: e.target.value }] }])}
    />
  ),
}));
vi.mock("@/components/maps/region-choropleth", () => ({ RegionChoropleth: () => null }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

import ImprovedCaseStudyForm from "@/components/forms/case-study-form";

const tags = [{ _id: "t1", label: { en: "Water Access" }, value: { current: "water" }, category: "topic" }];
const communities = [{ _id: "c1", name: { en: "West Africa" }, slug: { current: "west-africa" }, region: "ssa" }];

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset().mockImplementation(async (url: string) =>
    url.startsWith("/api/case-studies/drafts") ? new Response(JSON.stringify({ draft: null, id: "d1" })) : new Response(JSON.stringify({ id: "cs1" })),
  );
  vi.stubGlobal("fetch", fetchMock);
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

function mount() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ImprovedCaseStudyForm userId="u1" locale="en" availableTags={tags} regionalCommunities={communities} />
    </NextIntlClientProvider>,
  );
}

describe("case study form", () => {
  it("stays quiet while typing, explains on leaving the field, and clears when fixed", async () => {
    mount();
    const title = await screen.findByLabelText("Title");
    fireEvent.change(title, { target: { value: "Flo" } });
    expect(screen.queryByText(/at least 5 characters/)).toBeNull();
    fireEvent.blur(title);
    expect(await screen.findByText("Make the title a little longer (at least 5 characters)")).toBeTruthy();
    fireEvent.change(title, { target: { value: "Floods in Lagos" } });
    await waitFor(() => expect(screen.queryByText(/at least 5 characters/)).toBeNull());
  });

  it("submit with gaps focuses the first problem and lists what's left", async () => {
    mount();
    fireEvent.click((await screen.findAllByRole("button", { name: /Submit for review/ }))[0]);
    await waitFor(() => expect(document.activeElement?.id).toBe("field-title-en"));
    expect(screen.getAllByText("Add where this took place").length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalledWith("/api/case-studies/submit", expect.anything());
  });

  it("arabic writing language: right-to-left inputs, story editor in Arabic, English title required", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "العربية" }));
    expect((screen.getByLabelText("Title") as HTMLInputElement).dir).toBe("rtl");
    expect(screen.getByTestId("story").dataset.language).toBe("ar");
    expect(screen.getByLabelText("English title")).toBeTruthy();
  });

  it("shows a server's field message under the right field", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/case-studies/submit"
        ? new Response(JSON.stringify({ error: { message: "Some details need fixing — they're marked below.", fields: { "title.en": "A case study with this title already exists" } } }), { status: 400 })
        : new Response(JSON.stringify({ draft: null, id: "d1" })),
    );
    mount();
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Floods in Lagos" } });
    fireEvent.change(screen.getByLabelText("Summary"), { target: { value: "x".repeat(60) } });
    fireEvent.change(screen.getByTestId("story"), { target: { value: "It rained." } });
    fireEvent.click(screen.getByRole("button", { name: "Water Access" }));
    fireEvent.change(screen.getByRole("combobox", { name: /regional community/i }), { target: { value: "c1" } });
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: /Submit for review/ })[0]); });
    expect(await screen.findByText("A case study with this title already exists")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Some details need fixing");
  });
});
```

Render the community picker as a native `<select>` labelled "Regional community" (shadcn `Select` is not a combobox the test can drive). Use the same classes as `Input` for visual consistency. Label strings: add `caseStudySubmission.fields.community`: "Regional community (optional if you add a place)".

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/case-study-form.test.tsx`
Expected: FAIL (labels missing, no focus management, old toast behaviour).

- [ ] **Step 3: Build the section components**

`writing-language.tsx`: a `role="radiogroup"` of four `min-h-11` pill buttons (`aria-pressed`), labelled by `t('sections.writingIn')`, calling `onChange(lang)`, with the current language's native name shown. It reuses the old switcher's classes.

`story-section.tsx`: props `{ lang, values, set(path, value), errors, leave, describedBy, t }`.
- Renders title `<input id={fieldId(`title.${lang}`)}>`, keeping the large editorial classes from the old form but with a visible `<label>` "Title".
- Summary textarea (`excerpt.${lang}`) with `CharCounter` and hint `t('fields.summaryHint', { min: 50 })`.
- `PortableTextEditor` with `id={fieldId("content")}`, `language={lang}`, `variant="canvas"`.
- When `lang !== "en"`, the English title and summary inputs.
- The `<details>` translations block.
- Each input is followed by `FieldError`.

`people-section.tsx`: `BylineChips` with `errors` (a record keyed `authors.N.name` / `authors.N.email`) and ids `fieldId(`authors.${i}.name`)`. In `byline-chips.tsx`, open the chip editor automatically for any author with an error. Render `FieldError` under that author's inputs, and add `id` props to its name/email inputs. Then the organisation input.

`where-section.tsx`: `PlacePicker` (with `inputId`, `onBlur={() => leave("location")}`, `describedBy`), `FieldError path="location"`, the native `<select id="field-community">` of communities, and the two date inputs (`studyPeriod.startDate`, `studyPeriod.endDate` with `FieldError`).

- [ ] **Step 4: Write `use-case-study-draft.ts`**

```ts
"use client";

import { useEffect, useRef, useState } from "react";
import { localeHeaders } from "@/lib/forms/read-form-error";

export type DraftState = "idle" | "saving" | "saved" | "error";
const localKey = (id: string | null) => `case-study-draft:${id ?? "new"}`;

/** Server autosave + an on-device copy, so nothing typed is ever lost. */
export function useCaseStudyDraft<T>({
  values, enabled, locale, draftId, setDraftId, editId,
}: { values: T; enabled: boolean; locale: string; draftId: string | null; setDraftId: (id: string) => void; editId?: string }) {
  const [state, setState] = useState<DraftState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    try { localStorage.setItem(localKey(draftId), JSON.stringify({ savedAt: Date.now(), values })); } catch { /* storage full or blocked */ }
    if (first.current) { first.current = false; return; }
    const timer = setTimeout(async () => {
      setState("saving");
      try {
        const res = await fetch("/api/case-studies/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...localeHeaders(locale) },
          body: JSON.stringify(editId ? { editId, draftData: values } : { draftId, draftData: values }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const { id } = (await res.json()) as { id?: string };
        if (id && !draftId && !editId) setDraftId(id);
        setSavedAt(new Date());
        setState("saved");
      } catch {
        setState("error");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [values, enabled, locale, draftId, editId, setDraftId]);

  const saveNow = async () => { first.current = false; setState("saving"); /* same body as above */ };

  return { state, savedAt, saveNow, localKey: localKey(draftId) };
}

export function readLocalDraft<T>(id: string | null): { savedAt: number; values: T } | null {
  try {
    const raw = localStorage.getItem(localKey(id));
    return raw ? (JSON.parse(raw) as { savedAt: number; values: T }) : null;
  } catch {
    return null;
  }
}
```

Implement `saveNow` by extracting the POST body into a local `async function post()` used by both the timer and `saveNow`. Don't duplicate the body.

- [ ] **Step 5: Rewrite `case-study-form.tsx`**

Compose, in this order, inside `<div className="mx-auto flex max-w-6xl gap-10 pb-28 lg:pb-10">`:
1. `<main className="min-w-0 flex-1">` holding the header, restore banner, `formMessage` banner (`role="alert"`), `WritingLanguage`, `HeroImageDrop` (cover), `StorySection`, `PeopleSection`, `WhereSection`, the Tags section (`TagPicker` + `TagSuggestions` with the `forms.tagSuggestions` wording "Can't find it? Suggest a new tag for the editors"), and the Presentation section (`LayoutChooser`).
2. `<WhatsLeft items={items} status={<DraftStatusLine … />} actions={<>SaveDraft · Preview · Submit</>} />`

Each section is a `<section aria-labelledby>` with a `font-heading text-xl` heading.

The review step keeps its layout, with these changes: it shows `values.title[lang]`, the main theme (via `mainTheme`), the place name or community name (never coordinates), and the cover preview `imageUrl`. Its Submit calls the same `submit()`.

Submission body (JSON inside the existing multipart `data`): `{ ...values, collaborationId?, editId? }`. The cover is sent as `imageAssetId`, and the multipart `image` part is no longer used.

- [ ] **Step 6: Run the test, then related tests and the type check**

Run: `npx vitest run lib/__tests__/case-study-form.test.tsx lib/__tests__/whats-left.test.tsx lib/__tests__/place-picker.test.tsx lib/__tests__/tag-picker.test.tsx && npx tsc --noEmit -p .`
Expected: PASS; tsc prints nothing.

- [ ] **Step 7: Lint the changed files**

Run: `npx eslint components/forms/case-study-form.tsx components/forms/case-study/ components/forms/errors/ components/forms/place-picker.tsx`
Expected: no errors. If React's rules flag state set in an effect or refs read during render, apply the patterns used in `components/issue-report/use-issue-report.ts` (`useSyncExternalStore` for browser-only values; keep refs out of returned objects).

- [ ] **Step 8: Commit**

```bash
git add components/forms/ messages/*.json lib/__tests__/case-study-form.test.tsx
git commit -m "feat(case-studies): the submission form rebuilt — clear order, errors where they happen, and a What's left checklist"
```

---

### Task 15: API routes answer in the shared shape; in-review autosave

**Files:**
- Modify: `app/api/case-studies/submit/route.ts`
- Modify: `app/api/case-studies/drafts/route.ts` (`editId` branch → `saveSubmissionEdits`; errors in the shared shape)
- Modify: `app/api/uploads/image/route.ts` (errors in the shared shape with `upload.tooBig`/`upload.wrongType`; allow JPEG/PNG/WebP up to 5 MB)
- Test: extend `lib/__tests__/case-study-drafts-route.test.ts`; create `lib/__tests__/case-study-submit-route.test.ts`

**Interfaces:**
- Consumes: `formErrorResponse`, `requestLocale` (Task 3); `makeCaseStudySubmissionSchema` (Task 6); `getAvailableCaseStudyTags` with `category` (Task 13); `saveSubmissionEdits`, `submitCaseStudy` (Task 12).

Submit route rules:
- 401 → `formErrorResponse({ request, formKey: ERROR_KEYS.formSignIn, status: 401 })`
- Rate-limited → reply with `ERROR_KEYS.formRateLimited` and status 429. Wrap the existing `rateLimitRequest` result: if it returns a response, return `formErrorResponse({ request, formKey: ERROR_KEYS.formRateLimited, status: 429 })` instead.
- JSON parse failure → `formGeneric`, 400.
- Validation: `themeTagIds = new Set((await getAvailableCaseStudyTags()).filter((t) => t.category === "topic").map((t) => t._id))`, then `makeCaseStudySubmissionSchema({ themeTagIds }).safeParse(parsed)`. On failure → `formErrorResponse({ request, issues: validation.error, input: parsed })`.
- `CaseStudyEditNotAllowedError` → `formNotAllowed`, 403.
- Any other error → log as today (drop the Sanity env diagnostics from the log), then `formGeneric`, 500.
- Success response unchanged, minus the English `message` string.
- Pass `originalLanguage`, `imageAssetId` and `place` (with `country`/`city`) to `submitCaseStudy`. Remove `topic`, `locationText` and `studyLocation`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/case-study-submit-route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: "u1" })), currentUser: vi.fn(async () => ({ imageUrl: "", username: "ada", emailAddresses: [] })) }));
vi.mock("@/lib/rate-limit-route", () => ({ rateLimitRequest: vi.fn(async () => null) }));
vi.mock("@/lib/analytics/server", () => ({ captureAfterResponse: vi.fn() }));
vi.mock("@/lib/actions/workspace-outputs", () => ({ addOutput: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => Object.assign((key: string) => `T(${key})`, { has: () => true }),
}));
const submit = vi.fn(async () => ({ id: "cs1", slug: "s", status: "pending" }));
vi.mock("@/lib/content/case-studies", () => ({
  submitCaseStudy: submit,
  getAvailableCaseStudyTags: vi.fn(async () => [{ _id: "t1", category: "topic" }]),
  CaseStudyEditNotAllowedError: class extends Error {},
}));

import { POST } from "@/app/api/case-studies/submit/route";

const request = (data: unknown) => {
  const body = new FormData();
  body.append("data", JSON.stringify(data));
  return new Request("http://x/api/case-studies/submit", { method: "POST", body, headers: { "x-locale": "fr" } }) as never;
};

beforeEach(() => submit.mockClear());

describe("POST /api/case-studies/submit", () => {
  it("answers problems per field in plain words", async () => {
    const res = await POST(request({ title: { en: "ab" }, content: [], authors: [{ name: "A" }], tags: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe("T(form.fixBelow)");
    expect(body.error.fields).toMatchObject({ "title.en": "T(title.tooShort)", tags: "T(tags.themeRequired)", location: "T(location.required)" });
    expect(submit).not.toHaveBeenCalled();
  });

  it("accepts a complete submission and passes language and place through", async () => {
    const place = { lat: 6.45, lng: 3.39, text: "Lagos", precision: "city", countryCode3: "NGA", country: "Nigeria", city: "Lagos" };
    const res = await POST(request({
      originalLanguage: "en", title: { en: "Floods in Lagos" }, excerpt: { en: "x".repeat(60) },
      content: [{ _type: "block", children: [{ _type: "span", text: "It rained." }] }],
      authors: [{ name: "Ada" }], tags: ["t1"], place,
    }));
    expect(res.status).toBe(200);
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ originalLanguage: "en", place }));
  });
});
```

Add to `case-study-drafts-route.test.ts`:

```ts
  it("autosaves edits to a submission in review without resubmitting it", async () => {
    const res = await POST(post({ editId: "cs1", draftData: GOOD_DRAFT }));
    expect(res.status).toBe(200);
    expect(saveEdits).toHaveBeenCalledWith("user_drafts", "cs1", expect.any(Object));
    expect(saveDraft).not.toHaveBeenCalled();
  });
```

(Mock `saveSubmissionEdits` as `saveEdits` in that file's existing `vi.mock("@/lib/content/case-studies", …)`.)

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run lib/__tests__/case-study-submit-route.test.ts lib/__tests__/case-study-drafts-route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the three routes** as specified above. For drafts, extend `saveBodySchema` with `editId: z.string().min(1).max(200).optional()`. When present, call `saveSubmissionEdits(userId, editId, stripServerOwnedDraftKeys(draftData))` and return `{ id: editId }`. Map `CaseStudyEditNotAllowedError` to `formNotAllowed` (403). For uploads, replace each `{ error: "…" }` 400 with `formErrorResponse({ request, formKey: ERROR_KEYS.uploadTooBig, values: { size: (file.size / 1048576).toFixed(1), max: 5 } })` or `uploadWrongType`.

- [ ] **Step 4: Run them and confirm they pass**

Run: `npx vitest run lib/__tests__/case-study-submit-route.test.ts lib/__tests__/case-study-drafts-route.test.ts lib/__tests__/case-study-drafts-get-route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/case-studies/ app/api/uploads/image/route.ts lib/__tests__/case-study-submit-route.test.ts lib/__tests__/case-study-drafts-route.test.ts
git commit -m "feat(case-studies): routes answer in plain words per field, and edits in review autosave"
```

---

### Task 16: Topic → tag conversion (dry run first) and "Vulnerable Populations" re-filed

**Files:**
- Create: `scripts/case-studies/topic-to-tags.ts`
- Create: `lib/case-studies/topic-tag-map.ts` (the confirmed mapping, filled in **after** the user confirms the dry-run table)
- Test: `lib/__tests__/topic-to-tags.test.ts`

**Interfaces:**
- Produces:
  - `proposeTopicMapping(topics: Array<{ value: string; label: string }>, tags: Array<{ id: string; label: string; category: string | null }>): Array<{ topic: string; tagId: string | null; tagLabel: string | null; score: number }>` (pure; label-word overlap on `topic`-category tags only; `tagId` null when the score is below 0.34)
  - `planConversion(caseStudies: Array<{ id: string; topic: string | null; tags: string[] }>, mapping: Record<string, string>): Array<{ id: string; before: string[]; after: string[] }>`: puts the mapped tag first unless present; case studies without a mapped topic are left out
  - `LEGACY_TOPIC_TO_TAG: Record<string, string>`, used by Task 13's `?topic=` handling

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/topic-to-tags.test.ts
import { describe, expect, it } from "vitest";
import { planConversion, proposeTopicMapping } from "@/scripts/case-studies/topic-to-tags";

describe("topic → tag conversion", () => {
  it("proposes the closest theme tag and leaves weak matches for a human", () => {
    const proposal = proposeTopicMapping(
      [{ value: "migration", label: "Migration & Displacement" }, { value: "digital-inclusion", label: "Digital Inclusion" }],
      [{ id: "t-mig", label: "Migration", category: "topic" }, { id: "t-farm", label: "Farmers", category: "audience" }],
    );
    expect(proposal).toEqual([
      expect.objectContaining({ topic: "migration", tagId: "t-mig" }),
      expect.objectContaining({ topic: "digital-inclusion", tagId: null }),
    ]);
  });

  it("puts the mapped tag first so it becomes the main theme, without duplicating", () => {
    expect(planConversion(
      [{ id: "a", topic: "migration", tags: ["x"] }, { id: "b", topic: "migration", tags: ["t-mig", "x"] }, { id: "c", topic: "other", tags: [] }],
      { migration: "t-mig" },
    )).toEqual([
      { id: "a", before: ["x"], after: ["t-mig", "x"] },
      { id: "b", before: ["t-mig", "x"], after: ["t-mig", "x"] },
    ]);
  });
});
```

(`scripts/**` is excluded from vitest discovery but can still be imported by a test in `lib/__tests__`.)

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/__tests__/topic-to-tags.test.ts`
Expected: FAIL, because the module is missing.

- [ ] **Step 3: Implement the script**

```ts
// scripts/case-studies/topic-to-tags.ts
/**
 * Converts each case study's retired `topic` into a theme tag, first in its
 * tags so it becomes the main theme. Dry run by default; `--execute` writes.
 *
 *   pnpm exec tsx scripts/case-studies/topic-to-tags.ts            # dev dry run
 *   pnpm exec tsx scripts/case-studies/topic-to-tags.ts --execute  # dev write
 *
 * Production runs are the user's, with the prod env (see the runbook).
 */
const words = (s: string) => new Set(s.toLowerCase().replace(/&/g, " ").split(/[^a-z]+/).filter((w) => w.length > 2));

export function proposeTopicMapping(
  topics: Array<{ value: string; label: string }>,
  tags: Array<{ id: string; label: string; category: string | null }>,
) {
  const themes = tags.filter((t) => t.category === "topic");
  return topics.map((topic) => {
    const a = words(topic.label);
    let best: { id: string; label: string; score: number } | null = null;
    for (const tag of themes) {
      const b = words(tag.label);
      const shared = [...a].filter((w) => b.has(w)).length;
      const score = shared / Math.max(a.size, b.size, 1);
      if (!best || score > best.score) best = { id: tag.id, label: tag.label, score };
    }
    const ok = best && best.score >= 0.34;
    return { topic: topic.value, tagId: ok ? best!.id : null, tagLabel: ok ? best!.label : null, score: best?.score ?? 0 };
  });
}

export function planConversion(
  caseStudies: Array<{ id: string; topic: string | null; tags: string[] }>,
  mapping: Record<string, string>,
) {
  return caseStudies.flatMap((cs) => {
    const tagId = cs.topic ? mapping[cs.topic] : undefined;
    if (!tagId) return [];
    const after = cs.tags.includes(tagId) ? cs.tags : [tagId, ...cs.tags];
    return [{ id: cs.id, before: cs.tags, after }];
  });
}

async function main() {
  const { assertPayloadDatabase, getPayloadInstance, IMPORT_WRITE_CONTEXT, loadEnv } = await import("../payload-import/lib/runtime");
  const { LEGACY_TOPIC_TO_TAG } = await import("../../lib/case-studies/topic-tag-map");
  await loadEnv();
  const execute = process.argv.includes("--execute");
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, { action: execute ? "convert topics" : "read" });
  const payload = await getPayloadInstance();

  const topicField = (payload.collections.caseStudies.config.fields as Array<{ name?: string; options?: Array<{ value: string; label: string }> }>).find((f) => f.name === "topic")!;
  const tags = (await payload.find({ collection: "tags", pagination: false, depth: 0, locale: "en" })).docs.map((t) => ({ id: String(t.id), label: String((t as { label?: string }).label ?? ""), category: (t as { category?: string }).category ?? null }));
  const proposal = proposeTopicMapping(topicField.options ?? [], tags);
  console.log("\nProposed topic → theme tag (confirm, then copy into lib/case-studies/topic-tag-map.ts):");
  console.table(proposal.map((p) => ({ topic: p.topic, tag: p.tagLabel ?? "— needs your decision —", score: p.score.toFixed(2) })));

  const docs = (await payload.find({ collection: "caseStudies", pagination: false, depth: 0, draft: true })).docs.map((d) => ({ id: String(d.id), topic: (d as { topic?: string }).topic ?? null, tags: ((d as { tags?: unknown[] }).tags ?? []).map(String) }));
  const plan = planConversion(docs, LEGACY_TOPIC_TO_TAG);
  console.log(`\n${plan.length} case studies would change:`);
  console.table(plan.map((p) => ({ id: p.id, before: p.before.join(","), after: p.after.join(",") })));

  if (!execute) { console.log("\nDry run only. Re-run with --execute to write."); process.exit(0); }
  for (const p of plan) {
    if (p.before.join() === p.after.join()) continue;
    await payload.update({ collection: "caseStudies", id: p.id, data: { tags: p.after } as never, context: IMPORT_WRITE_CONTEXT });
  }
  const vulnerable = await payload.find({ collection: "tags", where: { value: { equals: "vulnerable-populations" } }, limit: 1, depth: 0 });
  if (vulnerable.docs[0] && (vulnerable.docs[0] as { category?: string }).category === "location") {
    await payload.update({ collection: "tags", id: vulnerable.docs[0].id, data: { category: "audience" } as never, context: IMPORT_WRITE_CONTEXT });
    console.log("Re-filed 'Vulnerable Populations' under Who it affects.");
  }
  console.log("Done.");
  process.exit(0);
}

if (process.argv[1]?.endsWith("topic-to-tags.ts")) void main();
```

```ts
// lib/case-studies/topic-tag-map.ts
/** Retired case-study topic → theme tag id. Filled from the user-confirmed dry-run table (plan Task 16). */
export const LEGACY_TOPIC_TO_TAG: Record<string, string> = {};
```

Before writing the Vulnerable Populations fix, check its slug: run the dry run and print `tags` whose label is "Vulnerable Populations", then use that `value`.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/__tests__/topic-to-tags.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Dry run on dev, then STOP for the user**

Run: `pnpm exec tsx scripts/case-studies/topic-to-tags.ts`
Paste the proposed mapping table and the "would change" table to the user. Ask them to confirm or correct each row, especially the "needs your decision" rows, where they may create a tag in the CMS or pick one. **Do not continue until they answer.**

- [ ] **Step 6: Fill the confirmed map, execute on dev, verify**

Write the confirmed pairs into `LEGACY_TOPIC_TO_TAG`. Run with `--execute`, then run the dry run again.
Expected: the second dry run lists every case study with `before` equal to `after`.

- [ ] **Step 7: Commit**

```bash
git add scripts/case-studies/topic-to-tags.ts lib/case-studies/topic-tag-map.ts lib/__tests__/topic-to-tags.test.ts
git commit -m "feat(tags): convert retired topics into theme tags, confirmed table, dry run first"
```

---

### Task 17: "Originally written in" on the published page

**Files:**
- Modify: `app/[locale]/(main)/research-and-action/case-studies/[slug]/page.tsx`
- Modify: `messages/{en,es,fr,ar}.json` (`caseStudies.originallyWrittenIn`)
- Test: `lib/__tests__/case-study-original-language.test.tsx`

**Interfaces:**
- Consumes: `caseStudy.contentLanguage` (Task 10).
- Produces: `OriginalLanguageNote({ contentLanguage, locale })`, exported from `components/case-studies/original-language-note.tsx`. It renders nothing when they match.

Wording: en "Originally written in {language}", es "Escrito originalmente en {language}", fr "Écrit à l'origine en {language}", ar "كُتب في الأصل بـ{language}". Language names come from `Intl.DisplayNames([locale], { type: "language" })`.

- [ ] **Step 1: Write the failing test**

```tsx
// lib/__tests__/case-study-original-language.test.tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { OriginalLanguageNote } from "@/components/case-studies/original-language-note";

afterEach(() => cleanup());
const mount = (contentLanguage: string | null) =>
  render(<NextIntlClientProvider locale="en" messages={{ caseStudies: en.caseStudies }}><OriginalLanguageNote contentLanguage={contentLanguage as never} locale="en" /></NextIntlClientProvider>);

describe("OriginalLanguageNote", () => {
  it("names the original language when it differs", () => {
    mount("ar");
    expect(screen.getByText("Originally written in Arabic")).toBeTruthy();
  });
  it("says nothing when it matches", () => {
    mount("en");
    expect(screen.queryByText(/Originally written/)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails.** Run: `npx vitest run lib/__tests__/case-study-original-language.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// components/case-studies/original-language-note.tsx
import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";

type Lang = "en" | "es" | "fr" | "ar";

export function OriginalLanguageNote({ contentLanguage, locale }: { contentLanguage: Lang | null | undefined; locale: Lang }) {
  const t = useTranslations("caseStudies");
  if (!contentLanguage || contentLanguage === locale) return null;
  const language = new Intl.DisplayNames([locale], { type: "language" }).of(contentLanguage) ?? contentLanguage;
  return (
    <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
      <Languages className="size-4" aria-hidden />
      {t("originallyWrittenIn", { language })}
    </p>
  );
}
```

In `page.tsx`, render `<OriginalLanguageNote contentLanguage={caseStudy.contentLanguage} locale={supportedLocale} />` above each `PortableTextRenderer`. Change both renderers' `isRTL` to `(caseStudy.contentLanguage ?? supportedLocale) === 'ar'`, and wrap the body in `<div lang={caseStudy.contentLanguage ?? supportedLocale}>`.

- [ ] **Step 4: Run it and confirm it passes.** Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/case-studies/original-language-note.tsx "app/[locale]/(main)/research-and-action/case-studies/[slug]/page.tsx" messages/*.json lib/__tests__/case-study-original-language.test.tsx
git commit -m "feat(case-studies): published stories say which language they were written in, in the right direction"
```

---

### Task 18: End-to-end check on the dev database, full suite, handover

**Files:**
- Create then delete: `scripts/zz-forms-e2e.tmp.ts`
- Modify: `docs/migration/payload-production-runbook.md` (append the production steps for this work)

- [ ] **Step 1: Full suite, type check, lint of changed files**

Run: `npx vitest run && npx tsc --noEmit -p . && npx eslint $(git diff --name-only master...HEAD -- '*.ts' '*.tsx')`
Expected: all tests pass; tsc prints nothing; no new lint errors in changed files (the 2 existing warnings in `lib/content/internal/payload/case-studies.ts` are pre-existing).

- [ ] **Step 2: Real-library run on the dev database**

Write `scripts/zz-forms-e2e.tmp.ts` using the harness from the 2026-09-25 session. Run it with `NODE_OPTIONS="--import <scratchpad>/stub-server-only.mjs"`, where the loader stubs `server-only`, `next/cache` (pass-through `unstable_cache`) and `sanity/lib/live.ts`. The run:
1. saves an empty draft (`saveCaseStudyDraft(U, undefined, {})`) → expect an id;
2. saves a draft with `originalLanguage: "ar"`, a place and `imageAssetId` (upload a 1×1 PNG with `uploadImageAsset`), reopens it with `getCaseStudyDraftById` → expect all three back;
3. submits with a community only → expect success and `region` set from the community;
4. submits an Arabic original with an English title and a place → reads it back: `locale: "ar"` title is Arabic, `locale: "en"` title is English, `originalLanguage: "ar"`, `locationText` filled, `region: "ssa"`;
5. calls `saveSubmissionEdits` on the pending one → status still `pending`, title changed;
6. deletes everything it created and confirms zero leftovers by slug prefix `zz-`.

Expected: every line prints PASS. Then delete the script.

- [ ] **Step 3: Rendered pages (signed out)**

Run `pnpm dev`, then:
- `curl -s localhost:3000/en/research-and-action/case-studies | grep -c "Themes"` → ≥ 1
- `curl -s "localhost:3000/en/research-and-action/case-studies?topic=migration" -o /dev/null -w "%{http_code}"` → 200
- Open one published case study page and confirm no coordinate pattern: `curl -s localhost:3000/en/research-and-action/case-studies/<slug> | grep -E "[0-9]+\.[0-9]{2}, -?[0-9]+\.[0-9]{2}"` → no output
- `curl -s -o /dev/null -w "%{http_code}" localhost:3000/admin` → 200

- [ ] **Step 4: Append the production steps to the runbook**

Append to `docs/migration/payload-production-runbook.md` under a new heading "2026-09-26 human-friendly forms":
1. Before deploy: `PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status`, then `… migrate`. Expect `human_friendly_forms` applied.
2. Topic conversion dry run with prod env: `PAYLOAD_DATABASE_URL=<prod> pnpm exec tsx scripts/case-studies/topic-to-tags.ts`. Review the table. Then add `--execute` (this needs `allowProduction` passed to the guard: add a `--production` flag to the script that sets it).
3. Deploy: `vercel --prod`.
4. Re-index case studies: `curl -X POST -H "Authorization: Bearer $INTERNAL_SYNC_SECRET" -H "content-type: application/json" -d '{}' https://hub.connectingclimateminds.org/api/search/case-studies/sync`
5. Manual signed-in checks (below).

Add the `--production` flag to `scripts/case-studies/topic-to-tags.ts`: `assertPayloadDatabase(url, { action, allowProduction: process.argv.includes("--production") })`.

- [ ] **Step 5: Commit**

```bash
git add docs/migration/payload-production-runbook.md scripts/case-studies/topic-to-tags.ts
git commit -m "docs(runbook): production steps for the human-friendly forms release"
```

- [ ] **Step 6: Hand the user the signed-in checklist** (the agent can't sign in):
1. Start a case study, type two letters in the title, tab away → a plain message appears; finish the title → it disappears.
2. Press Submit with gaps → the page jumps to the first gap; "What's left" lists the rest; on a phone, the bottom bar shows the count.
3. Choose العربية → title, summary and story are right-to-left; English title and summary appear.
4. Search "Lagos" → pick → the name shows, with no numbers; the community is suggested.
5. Paste `## Findings\n- one\n- two` into the story → a heading and a list.
6. Add a cover image, leave, reopen from the dashboard → the image, place and language are all still there.
7. Submit, then open it again from the dashboard while it's pending, change a word, wait 2 s, reload → the change is kept and the status is still "In review".
