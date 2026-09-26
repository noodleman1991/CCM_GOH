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
