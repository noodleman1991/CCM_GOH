/**
 * Shared validation helpers so every document validates URLs, emails and
 * required fields the same friendly way. The `rule` arg is the per-field
 * validation rule (its concrete type varies by field — UrlRule, EmailRule,
 * StringRule — so we accept `any` and return it for chaining).
 */

/** Allow http/https/mailto URLs, optional unless chained with .required(). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlRule(rule: any) {
  return rule.uri({
    scheme: ["http", "https", "mailto"],
    allowRelative: false,
  });
}

/** A required URL (http/https/mailto). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requiredUrlRule(rule: any) {
  return urlRule(rule).required();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate an optional email address (friendly message). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function emailRule(rule: any) {
  return rule.custom((value: string | undefined) => {
    if (!value) return true;
    return EMAIL_REGEX.test(value)
      ? true
      : "Please enter a valid email address (e.g. name@example.org)";
  });
}

/** A required field with a human-readable field name in the message. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requiredString(rule: any, fieldLabel: string) {
  return rule.required().error(`Please add ${fieldLabel}`);
}
